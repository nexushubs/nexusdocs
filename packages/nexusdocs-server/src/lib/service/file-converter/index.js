import _ from 'lodash';
import filenamify from 'filenamify';
import config from 'config';
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
    console.log(key);
    let options;
    try {
      options = config.get(key);
      console.log(options);
    } catch(error) {
      options = {};
    }
    return options;
  }

  /**
   * Convert file format
   * @param {stream.Readable} inputStream 
   * @param {object} options 
   * @returns {stream.Readable} - The converted file format
   */
  convert(stream, filename, commands) {
    const ext = getExtension(filename);
    const ConverterClass = this.getConverterOptionsByExt(ext);
    const output = new PassThrough();
    try {
      if (!ConverterClass) {
        throw new ApiError(400, null, 'FileConverter: invalid converter');
      }
      const converter = new ConverterClass(stream, filename);
      commands = _.chunk(commands.split('/'), 2);
      _.each(commands, ([command, options]) => {
        converter.prepare(command, options);
      });
      const format = converter.getFormat();
      const resultStream = converter.exec();
      setImmediate(() => {
        output.emit('start', {
          filename: filenamify(`${filename}-${commands}.${format}`),
          format,
        });
      });
      resultStream.pipe(output);
    } catch(error) {
      output.emit('error', error);
    }
    return output;
  }
}
