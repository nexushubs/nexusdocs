import contentDisposition from 'content-disposition';
import path from 'path';
import { PassThrough } from 'stream';
import { Wrapper as oss} from 'ali-oss';

import BaseBucket from '../../base-bucket';

export default class AliOSSProviderBucket extends BaseBucket {

  constructor(provider, bucketName) {
    super(provider, bucketName);
    const { params } = this.provider.options;
    this.bucket = oss({
      ...params,
      bucket: bucketName,
    });
  }

  _openUploadStream(id, options) {
    const stream = new PassThrough;
    const putOptions = {
      headers: {
        'content-type': options.contentType,
      },
    };
    if (options.filename) {
      const filename = `${id}${path.extname(options.filename)}`;
      putOptions.headers['content-disposition'] = contentDisposition(filename);
    }
    console.log('AliOSSProviderBucket._openUploadStream()', id, 'stream', putOptions);
    this.bucket.putStream(id, stream, putOptions)
    .then(console.log)
    .catch(console.err);
    return stream;
  }

  async _openDownloadStream(id, options) {
    const stream = new PassThrough;
    const result = await this.bucket.getStream(id, stream)
    .catch(err => {
      stream.emit('error', err);
    });
    return result.stream;
  }

  getUrl(id, options = {}) {
    const urlOptions = {
      expires: options.expires || 3600,
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

  delete(id) {
    return this.bucket.delete(id);
  }

  find(id) {
    return this.bucket.find(id);
  }

  drop() {
    return this.bucket.drop();
  }
  
}
