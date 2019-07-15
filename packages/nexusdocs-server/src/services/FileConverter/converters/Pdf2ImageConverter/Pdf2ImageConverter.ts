import * as _ from 'lodash';

import { ApiError } from '../../../../lib/errors';
import { staticImplements } from '../../../../types/common';
import { FileContent } from '../../../../lib/FileContent';
import { TConvertingCommand, IFileConverterStatic, IFileConverter, BaseConverterConfig } from '../../types';
import { getCacheKey } from '../../utils';
import BaseConverter from '../../BaseConverter';
import Pdf2Image, { ServerOptions } from './Pdf2Image';
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

  prepare(command: string, options: TConvertingCommand) {
    switch (command) {
      case 'page':
        this.page = _.isString(options) ? parseInt(options) : options;
        break;
      case 'format':
        this.output.format = options + '';
        break;
      default:
        throw new ApiError(400, null, `Pdf2ImageConverter: invalid command ${command}`);
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
    const status = await client.convert(input.stream, {
      filename: input.filename,
      contentType: input.contentType,
    });
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
