import { GridFSBucket } from 'mongodb';

import BaseBucket from '../../base-bucket';

export default class GridFSProviderBucket extends BaseBucket {

  constructor(provider, bucketName) {
    super(provider, bucketName);
    this.db = this.provider.db;
    bucketName = `fs.${this.formatName(provider.name)}.${this.formatName(this.name)}`;
    this.bucketName = bucketName;
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

  truncate() {
    const { bucketName } = this;
    return Promise.all([
      this.db.collection(`${bucketName}.files`).remove(),
      this.db.collection(`${bucketName}.chunks`).remove(),
    ]);
  }

  drop() {
    return this.bucket.drop();
  }

}
