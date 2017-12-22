import _ from 'lodash';
import config from 'config';
import filenamify from 'filenamify';
import mime from 'mime-types';
import { PassThrough } from 'stream';

import BaseService from '~/lib/base-service';
import { getExtension } from '~/lib/util';
import { ApiError } from '~/lib/errors';
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
  convert(inputStream, filename, commands) {
    return new Promise((resolve, reject) => {
      const ext = getExtension(filename);
      const ConverterClass = this.getConverterOptionsByExt(ext);
      if (!ConverterClass) {
        throw new ApiError(400, null, 'FileConverter: invalid converter');
      }
      const converter = new ConverterClass(inputStream, filename);
      commands = _.chunk(commands.split('/'), 2);
      _.each(commands, ([command, options]) => {
        converter.prepare(command, options);
      });
      const format = converter.getFormat();
      const outputSteam = converter.exec();
      resolve({
        contentType: mime.contentType(format),
        stream: outputSteam,
      });
    });
  }
}
