import * as _ from 'lodash';
import * as config from 'config';
import * as mime from 'mime-types';

import { KeyValueMap } from '../../types/common';
import { IFileContent } from '../../types/file';
import { getExtension } from '../../lib/util';
import { ApiError } from '../../lib/errors';
import BaseService from '../BaseService';
import { IFileConverterService, IConvertingCommands, IConvertingOptions, IFileConverterStatic } from './types';
import * as converterClasses from './converters';
import { Commands } from './utils';
import { FileContent } from '../../lib/FileContent';

export type ConvertingJob = Promise<IFileContent | void>;

export default class FileConverter extends BaseService implements IFileConverterService {

  converters: KeyValueMap<IFileConverterStatic>;
  jobs: Map<string, ConvertingJob> = new Map;

  async init() {
    this.initConverters();
  }

  initConverters() {
    this.converters = {};
    _.each(converterClasses, (Converter, name) => {
      const options = this.getConvertorConfig(name);
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

  getConvertorConfig(name: string): any {
    const key = `services.FileConverter.converters.${name}`;
    let cfg: any;
    try {
      cfg = config.get(key);
    } catch(error) {
      cfg = {};
    }
    return cfg;
  }

  async convert(_input: IFileContent, commands: string | IConvertingCommands, options: IConvertingOptions = {}): Promise<IFileContent> {
    const { FileCache } = this.services;
    const { jobs } = this;
    const input = FileContent.from(_input);
    const { contentType, filename } = input;
    const { id, key } = options;

    const ext = filename ? getExtension(filename) : mime.extension(contentType) || 'bin';
    const Converter = this.getConverterOptionsByExt(ext);
    const cmd: IConvertingCommands = _.isString(commands) ? Commands.parse(commands) : commands;
    if (!Converter) {
      throw new ApiError(400, null, 'FileConverter: invalid converter');
    }

    const convert = async (opt: { preCache?: boolean, noCache?: boolean } = {}) => {
      await input.loadStream();
      if (!input.stream) {
        throw new TypeError('invalid input stream');
      }
      const config = this.getConvertorConfig(Converter.name);
      if (Converter.needBuffer && (!input.buffer || Buffer.isBuffer(input.buffer))) {
        await input.readToBuffer();
      }
      const converter = new Converter(input, cmd, options, config);
      _.each(cmd, (value, key) => {
        converter.prepare(key, value);
      })
      if (opt.preCache) {
        await converter.preCache();
      } else {
        await converter.exec();
        if (opt.noCache) {
          return converter.output;
        }
        await FileCache.set(key, converter.output);
      }
    }

    if (key) {
      if (!await FileCache.has(key)) {
        const jobId = Converter.needPreCache ? id : key;
        let job: ConvertingJob;
        if (jobs.has(jobId)) {
          job = jobs.get(jobId);
        } else {
          job = convert({ preCache: Converter.needPreCache });
          jobs.set(jobId, job);
        }
        await job;
      }
      return FileCache.get(key);
    } else {
      return convert({ noCache: true });
    }
  }
  
}
