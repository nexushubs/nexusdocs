import * as _ from 'lodash';
import * as contentDisposition from 'content-disposition';
import * as path from 'path';
import { PassThrough } from 'stream';
import * as OSS from 'ali-oss';

import { IStoreBucket, IUrlOptions, IConvertingOptions } from '../../types';
import BaseBucket from '../../BaseBucket';
import { convert } from './Converter';

export default class AliOSSProviderBucket extends BaseBucket implements IStoreBucket {

  public supportedInputTypes = [
    'bmp',
    'gif',
    'jpg',
    'png',
    'tiff',
    'webp',
  ];

  public supportedOutputTypes = [
    'bmp',
    'gif',
    'jpg',
    'png',
    'tiff',
    'webp',
  ];

  private bucket: any;

  constructor(provider, bucketName) {
    super(provider, bucketName);
    const { params } = this.provider.options;
    this.bucket = new (OSS as any)({
      ...params,
      bucket: bucketName,
    });
  }

  async _openUploadStream(id, options) {
    const stream = new PassThrough;
    const putOptions: any = {
      mime: options.contentType,
    };
    if (options.filename) {
      const filename = `${id}${path.extname(options.filename)}`;
      _.set(putOptions, 'headers.content-disposition', contentDisposition(filename));
    }
    await this.bucket.putStream(id, stream, putOptions);
    return stream;
  }

  async _openDownloadStream(id, options) {
    const result = await this.bucket.getStream(id);
    return result.stream;
  }

  async getUrl(id: string, options: IUrlOptions = {}) {
    const urlOptions = {
      expires: options.expires || 1800,
      response: {},
    }
    if (options.filename) {
      urlOptions.response['content-disposition'] = contentDisposition(options.filename);
    }
    if (options.contentType) {
      urlOptions.response['content-type'] = options.contentType;
    }
    return this.bucket.signatureUrl(id, urlOptions);
  }

  async getConvertedUrl(id: string, options: IConvertingOptions = {}) {
    const { inputType, commands, expires = 1800 } = options;
    const { supportedOutputTypes } = this;
    const process = convert(inputType, commands, { supportedOutputTypes });
    const urlOptions = {
      expires,
      process,
    }
    return this.bucket.signatureUrl(id, urlOptions);
  }

  async delete(id: string) {
    await this.bucket.delete(id);
  }
  
}
