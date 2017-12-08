import BaseBucket from '../base-bucket';
import { GridFSBucket } from 'mongodb';

export default class GridFSProviderBucket extends BaseBucket {

  constructor(provider, bucketName) {
    super(provider, bucketName);
    this.db = this.provider.db;
    bucketName = `fs.${this.formatName(provider.name)}.${this.formatName(this.name)}`;
    this.bucket = new GridFSBucket(this.db, { bucketName });
  }

  formatName(name) {
    return name.replace(/\./g, '_');
  }

  _openUploadStream(id, options) {
    const { filename } = options;
    delete options.filename;
    return this.bucket.openUploadStreamWithId(id, filename, options);
  }

  _openDownloadStream(id, options) {
    return this.bucket.openDownloadStream(id, options);
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
