import _ from 'lodash';
import config from 'config';
import getStream from 'get-stream';
import mime from 'mime-types';

import BaseService from 'services/BaseService';
import { getExtension } from 'lib/util';
import { ApiError } from 'lib/errors';
import * as converterClasses from './converters';
import { ConverterClassType, IFileConverterService } from './types';
import { Readable } from 'stream';

export default class FileConverter extends BaseService implements IFileConverterService {

  private converters: {[key: string]: ConverterClassType}

  async init() {
    this.initConverters();
  }

  private initConverters() {
    this.converters = {};
    _.each(converterClasses, Converter => {
      const options = this.getConverterOptions(Converter.name);
      if (options.disabled) {
        return;
      }
      _.each(Converter.prototype.extensions, ext => {
        this.converters[ext] = Converter;
      });
    });
  }

  private getConverterOptionsByExt(ext) {
    return this.converters[ext] || null;
  }

  private getConverterOptions(name: string): any {
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
   */
  async convert(inputStream: Readable, filename: string, commands: string) {
    const { FileCache } = this.services;
    const ext = getExtension(filename).toLowerCase();
    try {
      const Converter = this.getConverterOptionsByExt(ext);
      if (!Converter) {
        throw new ApiError(400, null, 'FileConverter: invalid converter');
      }
      const options = this.getConverterOptions(Converter.name);
      let buffer = null;
      if (Converter.prototype.needBuffer) {
        buffer = await getStream.buffer(inputStream);
      }
      const converter = new Converter(inputStream, filename, buffer, options);
      const commandParts = _.chunk(commands.split('/'), 2);
      commandParts.forEach(([command, options]) => {
        converter.prepare(command, options);
      });
      const format = converter.getFormat();
      const outputSteam = await converter.exec();
      return {
        contentType: mime.contentType(format) || 'application/octet-stream',
        stream: outputSteam,
      };
    } catch (error) {
      throw error;
    }
  }
  
}
