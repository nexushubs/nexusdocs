import { GridFSBucket, Db } from 'mongodb';
import BaseBucket from 'services/Store/BaseBucket';
import { IStoreBucket } from 'services/Store/types';


export default class GridFSProviderBucket extends BaseBucket implements IStoreBucket {

  private bucketName: string;
  private bucket: GridFSBucket;
  private _db: Db;

  constructor(provider, bucketName) {
    super(provider, bucketName);
    this._db = this.provider.db;
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
      this._db.collection(`${bucketName}.files`).remove({}),
      this._db.collection(`${bucketName}.chunks`).remove({}),
    ]);
  }

  drop() {
    return this.bucket.drop();
  }

}
