import { Writable, Readable } from 'stream';
import { KeyValueMap } from '../../types/common';
import BaseBucket from './BaseBucket';
import BaseProvider from './BaseProvider';

export interface IFileUploadInfo {
  _id?: string;
  filename?: string;
  contentType?: string;
  files_id?: string;
  store_id?: string;
  size?: number;
  md5?: string;
  path?: string;
  status?: 'ok'|'pending'|'skip'|'skipped';
  dateStarted?: Date;
  dateUploaded?: Date;
  metadata?: any;
}

export interface IUploadStreamOptions {
  filename?: string,
  contentType?: string,
  fileId?: string,
  md5?: string,
  size?: number,
  skip?: boolean,
}

export interface IStoreProvider {
  validOptions(options: any): void;
  bucket(bucketName: string): Promise<IBucket>;
}

export interface IBucketUploadOptions {
  contentType: string;
}

export interface IBucketDownloadOptions {
  start: number;
  end: number;
}

export interface IUrlOptions {
  filename?: string;
  contentType?: string;
  expires?: number;
  serverUrl?: string;
  download?: boolean;
}

export interface IConvertingOptions {
  inputType?: string;
  commands?: string;
  expires?: number;
}

export interface IBucketOptions {

}

export interface IProviderOptions {
  name?: string;
  type?: string;
  buckets: string[];
  params: any;
  Bucket: { new(provider: IProvider, options: IBucketOptions): IBucket };
}

export interface ITruncateResult {
  deletedCount: number;
}

export interface IStoreBucket {
  _openUploadStream(fileId: string, options: IBucketUploadOptions): Promise<Writable>;
  _openDownloadStream(fileId: string, options?: IBucketDownloadOptions): Promise<Readable>;
  getUrl(fileId: string, options: IUrlOptions): Promise<string>;
  getConvertedUrl(fileId: string, options: IConvertingOptions): Promise<string>;
  delete(fileId: string): Promise<void>;
  truncate(): Promise<ITruncateResult>
}

export interface IStoreProvider {
  destroy(): Promise<any>;
}

export interface IProvider extends BaseProvider, IBucket {}

export interface IBucket extends BaseBucket<IProvider, IBucket>, IStoreBucket {}

export interface IStoreService {
  provider(id: any, forceReload: boolean): Promise<any>;
  bucket(providerQuery: any, bucketName: string): Promise<IBucket & IStoreBucket>;
  hasType(type: string): boolean;
}
