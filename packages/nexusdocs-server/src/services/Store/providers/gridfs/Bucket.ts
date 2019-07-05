import { GridFSBucket, Db, FilterQuery } from 'mongodb';

import { IStoreBucket, IUrlOptions, IUploadStreamOptions, IBucketDownloadOptions } from '../../types';
import BaseBucket from '../../BaseBucket';
import Provider from './Provider'


export default class GridFSProviderBucket extends BaseBucket<Provider, GridFSProviderBucket> implements IStoreBucket {

  private bucketName: string;
  private bucket: GridFSBucket;
  private _db: Db;

  constructor(provider: Provider, bucketName: string) {
    super(provider, bucketName);
    this._db = (this.provider)._db;
    bucketName = `fs.${this.formatName(provider.name)}.${this.formatName(this.name)}`;
    this.bucketName = bucketName;
    this.bucket = new GridFSBucket(this._db, { bucketName });
  }

  private formatName(name: string) {
    return name.replace(/\./g, '_');
  }

  async _openUploadStream(id: string, options?: IUploadStreamOptions) {
    const { filename } = options;
    delete options.filename;
    return this.bucket.openUploadStreamWithId(id, filename, options);
  }

  async _openDownloadStream(id: string, options?: IBucketDownloadOptions) {
    return this.bucket.openDownloadStream(<any>id, options);
  }

  async delete(id: string) {
    await this.bucket.delete(<any>id);
  }

  find(filter: any) {
    return this.bucket.find(filter);
  }

  async truncate() {
    const { bucketName } = this;
    const { deletedCount } = await this._db.collection(`${bucketName}.files`).deleteMany({});
    await this._db.collection(`${bucketName}.chunks`).deleteMany({});
    return {
      deletedCount,
    }
  }

  async getUrl() {
    return '';
  }

  async getConvertedUrl() {
    return '';
  }

  drop() {
    return this.bucket.drop();
  }

}
