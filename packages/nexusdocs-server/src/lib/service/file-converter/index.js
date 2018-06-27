import _ from 'lodash';
import config from 'config';
import fs from 'fs';
import getStream from 'get-stream';
import mime, { contentType } from 'mime-types';
import { PassThrough } from 'stream';

import BaseService from 'lib/base-service';
import { getExtension } from 'lib/util';
import { ApiError } from 'lib/errors';
import * as converterClasses from './converters';

export default class FileConverter extends BaseService {

  init(options) {
    this.initConverters();
  }

  initConverters() {
    this.converters = {};
    _.each(converterClasses, Converter => {
      const options = this.getConverterOptions(Converter.name);
      if (options.disabled) {
        return;
      }
      _.each(Converter.extensions, ext => {
        this.converters[ext] = Converter;
      });
    });
  }

  getConverterOptionsByExt(ext) {
    return this.converters[ext] || null;
  }

  getConverterOptions(name) {
    const key = `services.FileConverter.converters.${name}`;
    let options;
    try {
      options = config.get(key);
    } catch(error) {
      options = {};
    }
    return options;
  }

  /**
   * Convert file format
   * @param {stream.Readable} inputStream 
   * @param {object} options 
   * @returns {Promise} - The converted file stream and content type
   */
  async convert(inputStream, filename, commands) {
    const { FileCache } = this.service();
    const ext = getExtension(filename).toLowerCase();
    try {
      const ConverterClass = this.getConverterOptionsByExt(ext);
      if (!ConverterClass) {
        throw new ApiError(400, null, 'FileConverter: invalid converter');
      }
      const options = this.getConverterOptions(ConverterClass.name);
      let buffer = null;
      if (ConverterClass.needBuffer) {
        buffer = await getStream.buffer(inputStream);
      }
      const converter = new ConverterClass(inputStream, filename, buffer, options);
      commands = _.chunk(commands.split('/'), 2);
      _.each(commands, ([command, options]) => {
        converter.prepare(command, options);
      });
      const format = converter.getFormat();
      const outputSteam = await converter.exec();
      return {
        contentType: mime.contentType(format),
        stream: outputSteam,
      };
    } catch (error) {
      throw error;
    }
  }
  
}
