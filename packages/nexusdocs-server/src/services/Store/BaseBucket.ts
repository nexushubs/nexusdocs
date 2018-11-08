import * as uuid from 'uuid';
import * as mime from 'mime-types';
import { Readable } from 'stream';
import * as _ from 'lodash';

import UploadStream from './UploadStream';
import BaseProvider from './BaseProvider';
import Base from '../../lib/Base';
import { IUrlOptions, IBaseBucket, IConvertingOptions } from './types';

export default class BaseBucket extends Base implements IBaseBucket {

  public provider: BaseProvider;
  public name: string;
  public supportedInputTypes: string[];

  constructor(provider, bucketName) {
    super();
    this.provider = provider;
    this.name = bucketName;
  }

  isConvertingSupported(type, commands) {
    const { supportedInputTypes } = this;
    if (type === 'jpeg') {
      type = 'jpg';
    }
    if (!_.isArray(supportedInputTypes) || !supportedInputTypes.includes(type)) {
      return false;
    }
    return true;
  }

  isNative() {
    return this.name === 'gridfs';
  }

  openUploadStream(options: any = {}) {
    const { filename, contentType, fileId, md5, size, skip } = options;
    const id = uuid.v4();
    const uploadOptions = {
      filename: filename || id,
      contentType: contentType || mime.lookup(filename) || 'application/octet-stream',
    };
    let providerUploadStream = null;
    if (!skip) {
      providerUploadStream = this._openUploadStream(id, { ...uploadOptions });
    }
    const uploadStream = new UploadStream(id, providerUploadStream, {
      ...uploadOptions,
      md5,
      size,
      fileId,
    });
    return uploadStream;
  }
    
  openDownloadStream(id) {
    let downloadStream;
    try {
      downloadStream = this._openDownloadStream(id);
    } catch(e) {
      downloadStream = new Readable();
      downloadStream.emit('error', e);
    }
    return downloadStream;
  }

  _openUploadStream(fileId, options: any = {}) {
    throw new Error('method openUploadStream() is not implemented');
  }

  _openDownloadStream(fileId, options: any = {}) {
    throw new Error('method openDownloadStream() is not implemented');
  }

  async getUrl(fileId: string, options: IUrlOptions): Promise<string> {
    throw new Error('method _getUrl() is not implemented');
  }

  async getDownloadUrl(fileId: string, filename): Promise<string> {
    return this.getUrl(fileId, { filename });
  }

  async getConvertedUrl(id: string, options: IConvertingOptions = {}): Promise<string> {
    throw new Error('method getConvertedUrl() is not implemented');
  }

  delete(id) {
    throw new Error('method delete() is not implemented');
  }
  
}
