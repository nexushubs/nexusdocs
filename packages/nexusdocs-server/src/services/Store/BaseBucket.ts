import * as uuid from 'uuid';
import * as mime from 'mime-types';
import { Readable, Writable } from 'stream';
import * as _ from 'lodash';

import UploadStream from './UploadStream';
import BaseProvider from './BaseProvider';
import Base from '../../lib/Base';
import { IUploadStreamOptions, IStoreBucket } from './types';

export default class BaseBucket<TProvider extends BaseProvider, TBucket extends BaseBucket<TProvider, TBucket> & IStoreBucket> extends Base {

  public provider: TProvider;
  public name: string;
  public supportedInputTypes: string[];

  constructor(provider: TProvider, bucketName: string) {
    super();
    this.provider = provider;
    this.name = bucketName;
  }

  isConvertingSupported(type: string, commands?: string) {
    const { supportedInputTypes } = this;
    if (type === 'jpeg') {
      type = 'jpg';
    }
    if (!_.isArray(supportedInputTypes) || !supportedInputTypes.includes(type)) {
      return false;
    }
    return true;
  }

  get isNative() {
    return this.name === 'gridfs';
  }

  async openUploadStream(options: IUploadStreamOptions) {
    const { filename, contentType, fileId, md5, size, skip } = options;
    const id = uuid.v4();
    const uploadOptions = {
      filename: filename || id,
      contentType: contentType || mime.lookup(filename) || 'application/octet-stream',
    };
    let providerUploadStream: Writable = null;
    if (!skip) {
      providerUploadStream = await (this as unknown as TBucket)._openUploadStream(id, { ...uploadOptions });
    }
    const uploadStream = new UploadStream(id, providerUploadStream, {
      ...uploadOptions,
      md5,
      size,
      fileId,
    });
    return uploadStream;
  }
    
  async openDownloadStream(id: string) {
    let downloadStream: Readable;
    try {
      downloadStream = await (this as unknown as TBucket)._openDownloadStream(id);
    } catch(e) {
      downloadStream = new Readable();
      downloadStream.emit('error', e);
    }
    return downloadStream;
  }

  async getDownloadUrl(fileId: string, filename: string): Promise<string> {
    return (this as unknown as TBucket).getUrl(fileId, { filename });
  }
  
}
