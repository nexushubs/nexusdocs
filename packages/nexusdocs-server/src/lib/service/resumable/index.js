import _ from 'lodash';
import EventEmitter from 'events';
import inspector from 'schema-inspector';
import camelCase from 'camelcase';
import upperCamelCase from 'uppercamelcase';

import BaseService from '~/lib/base-service';
import BaseCache from './base-cache';
import FSCache from './cache/fs';
import { ValidationError, buildValidationError } from '~/lib/errors';
import { uuidRegexPattern, loadClasses, createErrorEvent } from '~/lib/util';

// const DriverClasses = loadClasses('lib/resumable/cache');

/**
 * Resumable upload handler
 */
export default class Resumable extends BaseService {

  paramSchema = {
    chunkNumber: { type: 'integer', gt: 0 },
    chunkSize: { type: 'integer', gt: 0 },
    currentChunkSize: { type: 'integer', gt: 0 },
    totalSize: { type: 'integer', gt: 0 },
    type: { type: 'string', optional: true },
    identifier: { type: 'string', pattern: uuidRegexPattern, error: 'invalid identifier, should be uuid v4 format' },
    filename: { type: 'string', minLength: 0 },
    relativePath: { type: 'string', optional: true },
    totalChunks: { type: 'integer', gt: 0 },
  };

  init(options) {
    super.init();
    const defaultOptions = {
      // cacheDriver: 'fs',
      paramPrefix: 'resumable',
      maxFileSize: 256 * 1024 * 1024,
    };
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour
    this.cleanUpInterval = 5 * 60 * 1000; // 1 minute
    this.statusCache = {};
    this.options = _.defaults(options, defaultOptions);
    // this.cache = new DriverClasses[options.cacheDriver](this);
    this.cache = new FSCache(this);
    this.cleanUpTimer = setInterval(() => this.cleanUpStatus(), this.cleanUpInterval);
  }

  getParamSchema(type) {
    let schema;
    if (type == 'sanitize') {
      schema = _.mapValues(this.paramSchema, s => _.pick(s, 'type'));
    } else {
      schema = this.paramSchema;
    }
    return {
      type: 'object',
      properties: schema,
    };
  }

  validParams(params) {
    const {
      chunkNumber,
      chunkSize,
      totalSize,
      identifier,
      filename,
      totalChunks,
      fileSize,
    } = params;

    const _totalChunks = Math.max(Math.floor(totalSize / (chunkSize * 1.0)), 1);
    
    if (_totalChunks !== totalChunks) {
      return buildValidationError(null, 'totalChunks', 'resumable', 'invalid total chunks');
    }

    if (chunkNumber > totalChunks) {
      return buildValidationError(null, 'chunkNumber', 'resumable', 'chunkNumber should not greater than number of chunks');
    }

    if (this.options.maxFileSize && totalSize > this.options.maxFileSize) {
      return buildValidationError(null, 'totalSize', 'resumable', `file size is beyond the limit: ${this.options.maxFileSize}`);
    }

    if (!_.isUndefined(fileSize)) {
      if (chunkNumber < totalChunks && fileSize != chunkSize) {
        return buildValidationError(null, 'fileSize', 'resumable', 'invalid fileSize');
      }
      if (totalChunks > 1 && chunkNumber == totalChunks && fileSize != ((totalSize % chunkSize) + chunkSize)) {
        return buildValidationError(null, 'fileSize', 'resumable', 'invalid fileSize for the last chunk');
      }
      if (totalChunks == 1 && fileSize != totalSize) {
        return buildValidationError(null, 'fileSize', 'resumable', 'invalid fileSize for only a single chunk');
      }
    }
    return null;
  }

  parseParams(inputParams) {
    const { paramPrefix } = this.options;
    const params = {};
    _.each(inputParams, (value, key) => {
      if (key.indexOf(paramPrefix) === 0) {
        key = camelCase(key.slice(paramPrefix.length));
      }
      if (_.has(this.paramSchema, key)) {
        params[key] = value;
      }
    });
    inspector.sanitize(this.getParamSchema('sanitize'), params);
    console.log('params =!!!', params);
    const result = inspector.validate(this.getParamSchema('validate'), params);
    if (!result.valid) {
      throw new ValidationError(result.error);
      return null;
    }
    const error = this.validParams(params);
    if (error) {
      throw new ValidationError(error);
      return null;
    }
    return params;
  }

  cleanUpStatus() {
    const count = 0;
    const now = Date.now();
    _.map(this.statusCache, (cache, identifier) => {
      if (now > cache.updateTime + this.cacheTimeout) {
        const { params } = cache;
        this.cleanUp(params);
        delete this.statusCache[identifier];
      }
    });
  }

  checkChunkStatus(params, parse) {
    if (parse) {
      params = this.parseParams(params);
    }
    const { identifier, chunkNumber, totalChunks } = params;
    const index = chunkNumber - 1;
    const cache = this.statusCache[identifier];
    if (!cache) {
      return false;
    }
    return cache.status[index] == 1;
  }

  checkStatus(params, parse) {
    if (parse) {
      params = this.parseParams(params);
    }
    const { identifier, chunkNumber, totalChunks } = params;
    const cache = this.statusCache[identifier];
    if (!cache) {
      return false;
    }
    return _.sum(cache.status) == totalChunks;
  }

  updateStatus(params) {
    const { identifier, chunkNumber, totalChunks } = params;
    const index = chunkNumber - 1;
    const now = Date.now();
    if (!this.statusCache[identifier]) {
      const status = _.fill(new Array(totalChunks), 0, 0, totalChunks);
      this.statusCache[identifier] = {
        params,
        addTime: now,
        status,
      };
    }
    const cache = this.statusCache[identifier];
    cache.status[index] = 1;
    cache.updateTime = now;
  }

  validChunkSize(params, index, size) {
    const {
      chunkNumber,
      totalChunks,
    } = params;
  }

  async createWriteStream(params, readableStream) {
    params = this.parseParams(params);
    const { identifier } = params;
    const { File } = this.model();
    const exists = await File.exists({_id: identifier});
    if (exists) {
      throw new ValidationError(null, 'identifier', 'resumable', 'file already exists');
    }
    const writeStream = this.cache.createWriteStream(params, readableStream);
    writeStream.on('finish', async () => {
      try {
        this.updateStatus(params);
        const finished = this.checkStatus(params);
        writeStream.emit('done', {
          ...params,
          finished,
        });
      } catch(error) {
        writeStream.emit('error', error);
      }
    });
    return writeStream;
  }

  createReadStream(params, writableStream) {
    try {
      params = this.parseParams(params);
    } catch (err) {
      return createErrorEvent(err);
    }
    return this.cache.createReadStream(params, writableStream);
  }

  cleanUp(params) {
    this.cache.cleanUp(params);
  }

}
