import { Writable, Readable } from 'stream';

export interface IFileUploadInfo {
  _id?: string;
  filename?: string;
  contentType?: string;
  files_id?: string;
  size?: number;
  md5?: string;
  status?: 'ok'|'pending'|'skip'|'skipped';
  dateStarted?: Date;
  dateUploaded?: Date;
  metadata?: any;
}

export interface IUploadStreamOptions {
  filename?: string;
  contentType?: string;
  md5?: string;
  size?: number;
  fileId?: string;
}

export interface IStoreProvider {
  validOptions(options: any);
  bucket(bucketName: string): Promise<IStoreBucket>;
}

export interface IBucketUploadOptions {
  contentType: string;
}

export interface IBucketDownloadOptions {
  start?: number;
  end?: number;
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

export interface IUploadStreamOptions {
  filename?: string,
  contentType?: string,
  fileId?: string,
  md5?: string,
  size?: number,
  skip?: boolean,
}

export interface IBucketOptions {

}

export interface IProviderOptions {
  name?: string;
  type?: string;
  buckets: string[];
  params: any;
  Bucket: { new(provider: IStoreProvider, options: IBucketOptions): IStoreBucket };
}

export interface IBaseBucket {
  provider: IBaseProvider;
  name: string;
  supportedInputTypes: string[]; 
  isConvertingSupported(type: string, commands?: string): boolean;
  isNative(): boolean;
  openUploadStream(options: IUploadStreamOptions): Promise<Writable>;
  openDownloadStream(id: string): Promise<Readable>;
  getDownloadUrl(fileId: string, filename?: string): Promise<string>;
}

export interface IStoreBucket extends IBaseBucket {
  _openUploadStream(fileId: string, options: IBucketUploadOptions): Promise<Writable>;
  _openDownloadStream(fileId: string, options: IBucketUploadOptions): Promise<Readable>;
  getUrl(fileId: string, options: IUrlOptions): Promise<string>;
  getConvertedUrl(fileId: string, options: IConvertingOptions): Promise<string>;
  delete(fileId: string): Promise<void>
}

export interface IBaseProvider {
  options: IProviderOptions;
  name: string;
  buckets: {[key: string]: IStoreBucket};
  bucket(id: any): Promise<IStoreBucket>;
}

export interface IStoreProvider extends IBaseProvider{
  destroy(): Promise<any>;
}

export interface IStoreService {
  provider(id: any, forceReload: boolean): Promise<any>;
  bucket(providerQuery: any, bucketName: string): Promise<IStoreBucket>;
  hasType(type: string): boolean;
}
