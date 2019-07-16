import * as _ from 'lodash';

import { ApiError } from '../../../../lib/errors';
import { staticImplements } from '../../../../types/common';
import { FileContent } from '../../../../lib/FileContent';
import { TConvertingCommand, IFileConverterStatic, IFileConverter, BaseConverterConfig } from '../../types';
import { getCacheKey } from '../../utils';
import BaseConverter from '../../BaseConverter';
import Pdf2Image, { ServerOptions, Pdf2ImageConvertingOptions, Pdf2ImagePngDevices } from './Pdf2Image';
import * as fs from 'fs';
import getStream = require('get-stream');

let client: Pdf2Image | null = null;

interface Config extends ServerOptions, BaseConverterConfig {
}

@staticImplements<IFileConverterStatic<Config>>()
export default class Pdf2ImageConverter extends BaseConverter<Config> implements IFileConverter {

  static readonly inputFormats = [
    'pdf',
  ];

  static readonly outputFormats = [
    'png',
  ];

  static readonly needPreCache = true;

  private page: number = 0;
  private opt: Pdf2ImageConvertingOptions = {};

  prepare(command: string, options: TConvertingCommand) {
    switch (command) {
      case 'page':
        this.page = _.isString(options) ? parseInt(options) : options;
        break;
      case 'format':
        this.output.format = options + '';
        break;
      case 'device':
        if (_.isString(options) && Pdf2ImagePngDevices.includes(options)) {
          this.opt.device = options as any;
          break;
        }
      case 'res':
        this.opt.res = _.isString(options) ? parseInt(options) : options;
        break;
      case 'downScaleFactor':
      case 'down-scale-factor':
      case 'down':
        this.opt.downScaleFactor = _.isString(options) ? parseInt(options) : options;
        break;
      case 'backgroundColor':
      case 'background-color':
      case 'bgColor':
      case 'bg-color':
        if (_.isString(options) && /^[a-f\d]{6}$/i.test(options)) {
          this.opt.backgroundColor = options + '';
          break;
        }
      default:
        throw new ApiError(400, null, `Pdf2ImageConverter: invalid command ${command}=${options}`);
    }
  }

  async getClient() {
    if (!client) {
      client = new Pdf2Image(this.config);
      await client.init();
    }
    return client;
  }

  async preCache() {
    const { FileCache } = this.services;
    const { input, output, options: { id, key } } = this;
    const client = await this.getClient();
    const status = await client.convert(input, this.opt);
    if (key) {
      for (let p = 1; p <= parseInt(status.pageCount); p++) {
        const cacheKey = getCacheKey(id, { ...this.commands, page: p });
        await FileCache.set(cacheKey, {
          stream: await client.getPage(status, p),
          filename: `${input.filename}-${p}.${output.format}`,
          contentType: output.contentType,
        });
      }
    }
  }

  async exec() {
    const { FileCache } = this.services;
    const { options: { id } } = this;
    const cacheKey = getCacheKey(id, { ...this.commands, page: this.page });
    const fileContent = await FileCache.get(cacheKey);
    this.output = FileContent.from(fileContent);
  }
  
}
