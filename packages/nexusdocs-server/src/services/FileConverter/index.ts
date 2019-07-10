import * as _ from 'lodash';
import * as config from 'config';
import * as getStream from 'get-stream';
import * as mime from 'mime-types';
import { Readable } from 'stream';
import * as path from 'path';

import { KeyValueMap } from '../../types/common';
import { IFileContent } from '../../types/file';
import { getExtension } from '../../lib/util';
import { ApiError } from '../../lib/errors';
import { TCacheBuilder } from '../FileCache/types';
import BaseService from '../BaseService';
import { IFileConverterService, TConvertingOptionPair, IConvertingCommands, IConvertingOptions, IFileConverterStatic } from './types';
import * as converterClasses from './converters';
import { Commands, getCacheKey } from './utils';
import { FileContent } from '../../lib/FileContent';

export default class FileConverter extends BaseService implements IFileConverterService {

  converters: KeyValueMap<IFileConverterStatic>;
  jobs: Map<string, Promise<Readable>> ;

  async init() {
    this.initConverters();
  }

  initConverters() {
    this.converters = {};
    _.each(converterClasses, (Converter, name) => {
      const options = this.getConverterOptions(name);
      if (options.disabled) {
        return;
      }
      _.each(Converter.inputFormats, ext => {
        this.converters[ext] = Converter as any as IFileConverterStatic;
      });
    });
  }

  getConverterOptionsByExt(ext: string) {
    return this.converters[ext] || null;
  }

  getConverterOptions(name: string): any {
    const key = `services.FileConverter.converters.${name}`;
    let options :any;
    try {
      options = config.get(key);
    } catch(error) {
      options = {};
    }
    return options;
  }

  convert(_input: IFileContent, commands: string | IConvertingCommands, options: IConvertingOptions = {}): Promise<IFileContent> {
    const { FileCache } = this.services;
    const input = FileContent.from(_input);
    const { contentType, filename } = input;
    const { key } = options;
    const ext = filename ? getExtension(filename) : mime.extension(contentType) || 'bin';
    const Converter = this.getConverterOptionsByExt(ext);
    const cmd: IConvertingCommands = _.isString(commands) ? Commands.parse(commands) : commands;
    if (!Converter) {
      throw new ApiError(400, null, 'FileConverter: invalid converter');
    }
    const convert: TCacheBuilder = async () => {
      await input.loadStream();
      if (!input.stream) {
        throw new TypeError('invalid input stream');
      }
      const options = this.getConverterOptions(Converter.name);
      if (Converter.needBuffer && (!input.buffer || Buffer.isBuffer(input.buffer))) {
        await input.readToBuffer();
      }
      const converter = new Converter(input, cmd, options);
      _.each(cmd, (value, key) => {
        converter.prepare(key, value);
      })
      await converter.exec();
      return converter.output;
    }
    if (key && false) {
      const cacheKey = getCacheKey(key, cmd);
      return FileCache.get(cacheKey, convert);
    } else {
      return convert();
    }
  }
  
}
