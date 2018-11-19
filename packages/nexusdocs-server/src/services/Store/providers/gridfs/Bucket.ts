import { GridFSBucket, Db } from 'mongodb';

import { IStoreBucket } from '../../types';
import BaseBucket from '../../BaseBucket';
import Provider from './Provider'


export default class GridFSProviderBucket extends BaseBucket implements IStoreBucket {

  private bucketName: string;
  private bucket: GridFSBucket;
  private _db: Db;

  constructor(provider, bucketName) {
    super(provider, bucketName);
    this._db = (this.provider as Provider)._db;
    bucketName = `fs.${this.formatName(provider.name)}.${this.formatName(this.name)}`;
    this.bucketName = bucketName;
    this.bucket = new GridFSBucket(this._db, { bucketName });
  }

  private formatName(name) {
    return name.replace(/\./g, '_');
  }

  _openUploadStream(id, options) {
    const { filename } = options;
    delete options.filename;
    return this.bucket.openUploadStreamWithId(id, filename, options);
  }

  _openDownloadStream(id: string, options) {
    return this.bucket.openDownloadStream(<any>id, options);
  }

  async delete(id: string) {
    await this.bucket.delete(<any>id);
  }

  find(filter) {
    return this.bucket.find(filter);
  }

  truncate() {
    const { bucketName } = this;
    return Promise.all([
      this._db.collection(`${bucketName}.files`).deleteMany({}),
      this._db.collection(`${bucketName}.chunks`).deleteMany({}),
    ]);
  }

  drop() {
    return this.bucket.drop();
  }

}
