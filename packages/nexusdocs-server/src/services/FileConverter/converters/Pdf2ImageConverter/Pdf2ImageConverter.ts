import * as _ from 'lodash';

import { ApiError } from '../../../../lib/errors';
import { staticImplements } from '../../../../types/common';
import { TConvertingCommand, IFileConverterStatic } from '../../types';
import { getCacheKey } from '../../utils';
import BaseConverter from '../../BaseConverter';
import Pdf2Image from './Pdf2Image';

let client: Pdf2Image | null = null;

@staticImplements<IFileConverterStatic>()
class Pdf2ImageConverter extends BaseConverter {

  static readonly inputFormats = [
    'pdf',
  ];

  static readonly outputFormats = [
    'png',
  ];

  static readonly selfCache = true;

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
  
  async exec() {
    const { FileCache } = this.services;
    const { input, output, config: { key } } = this;
    const client = await this.getClient();
    const status = await client.convert(input.stream, {
      filename: input.filename,
      contentType: input.contentType,
    });
    if (key) {
      for (let p = 1; p <= parseInt(status.pageCount); p++) {
        const cacheKey = getCacheKey(key, { ...this.commands, page: p });
        FileCache.set(cacheKey, {
          stream: client.getPage(status, p),
          filename: `${output.filename}-${p}.${output.format}`,
          contentType: output.contentType,
        });
      }
    }
    const cacheKey = getCacheKey(key, { ...this.commands, page: this.page });
    const currentPage = await FileCache.get(cacheKey);
    return currentPage.stream;
  }
  
}

export default Pdf2ImageConverter;
