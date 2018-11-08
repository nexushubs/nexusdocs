import _ from 'lodash';
import inspector from 'schema-inspector';
import camelCase from 'camelcase';

import BaseService from 'services/BaseService';
import FSCache from './cache/fs';
import { ValidationError, buildValidationError } from 'lib/errors';
import { uuidRegexPattern, loadClasses, createErrorEvent } from 'lib/util';
import { ChunkStatus, IResumableCache, ResumableParams, IStatusCache, IResumableService } from './types';
import { ObjectPropertySchema, VarType, VarSchema } from 'types/schema';
import { Readable } from 'stream';

// const DriverClasses = loadClasses('lib/resumable/cache');

/**
 * Resumable upload handler
 */
export default class Resumable extends BaseService implements IResumableService {

  private paramSchema: ObjectPropertySchema = {
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

  private cacheTimeout: number;
  private cleanUpInterval: number;
  private statusCache: {[key: string]: IStatusCache};
  private cache: FSCache;
  private cleanUpTimer: NodeJS.Timeout = null;

  async init(options: any) {
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

  async stop() {
    clearInterval(this.cleanUpTimer)
  }

  getParamSchema(type: string): VarSchema {
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

  parseParams(inputParams: any): ResumableParams {
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
    const result = inspector.validate(this.getParamSchema('validate'), params);
    if (!result.valid) {
      throw new ValidationError(result.error);
    }
    const error = this.validParams(params);
    if (error) {
      throw new ValidationError(error);
    }
    return <ResumableParams> params;
  }

  cleanUpStatus() {
    const now = Date.now();
    _.map(this.statusCache, (cache, identifier) => {
      if (now > cache.updateTime + this.cacheTimeout) {
        const { params } = cache;
        this.cleanUp(params);
        delete this.statusCache[identifier];
      }
    });
  }

  checkChunkStatus(params: ResumableParams, parse: boolean = false): boolean {
    if (parse) {
      params = this.parseParams(params);
    }
    const { identifier, chunkNumber } = params;
    const index = chunkNumber - 1;
    const cache = this.statusCache[identifier];
    if (!cache) {
      return false;
    }
    return cache.status[index] === ChunkStatus.Ok;
  }

  checkStatus(params: ResumableParams, parse: boolean = false) {
    if (parse) {
      params = this.parseParams(params);
    }
    const { identifier, totalChunks } = params;
    const cache = this.statusCache[identifier];
    if (!cache) {
      return false;
    }
    return _.sum(cache.status) === totalChunks;
  }

  updateStatus(params) {
    const { identifier, chunkNumber, totalChunks } = params;
    const index = chunkNumber - 1;
    const now = Date.now();
    if (!this.statusCache[identifier]) {
      this.statusCache[identifier] = {
        params,
        addTime: now,
        updateTime: null,
        status: _.fill(new Array(totalChunks), ChunkStatus.Pending),
      };
    }
    const cache = this.statusCache[identifier];
    cache.status[index] = 1;
    cache.updateTime = now;
  }

  validChunkSize(params, index, size) {
    // TODO
    const {
      chunkNumber,
      totalChunks,
    } = params;
  }

  async createWriteStream(params: ResumableParams) {
    params = this.parseParams(params);
    const { identifier } = params;
    const { File } = this.models;
    const exists = await File.exists({_id: identifier});
    if (exists) {
      throw new ValidationError(null, 'identifier', 'resumable', 'file already exists');
    }
    const writeStream = this.cache.createWriteStream(params);
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

  async createReadStream(params: ResumableParams) {
    try {
      params = this.parseParams(params);
    } catch (err) {
      return createErrorEvent(err);
    }
    return this.cache.createReadStream(params);
  }

  cleanUp(params) {
    this.cache.cleanUp(params);
  }

}
