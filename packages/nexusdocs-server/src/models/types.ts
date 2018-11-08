import { IBase } from '../types';
import { Collection, FindOneOptions, FilterQuery, ObjectId } from 'mongodb';
import { Validator } from '../lib/validator';
import { Writable, Readable } from 'stream';
import { Archiver } from 'archiver';
import { IUrlOptions } from '../services/Store/types';

export interface IDocData {
  _id?: ObjectId|string;
}

export interface IClientUrlOptions {
  hostname: string;
  port: number;
  schema: string;
  entry: string;
}

export type IGetOneQueryFilter = string | ObjectId | FilterQuery<any>;

export interface IBaseModel<T,S> extends IBase {
  defaultQueryOptions: FindOneOptions;
  _active: boolean;
  _deleted: boolean;
  _data: S;
  validator: Validator;
  validators: {[key: string]: any};
  schema: any;
  collectionName: string;
  collection: Collection
  getInstance(data): T;
  init();
  validate(data: S, options: any);
  validateOne(key: string, value: any);
  generateId(id: any): any;
  prepareId(id: any): any;
  prepareData(data: S, validateOptions: any);
  beforeCreate(data: S): Promise<void>;
  create(data: S, skipHooks?: boolean): Promise<any>;
  beforeUpdate(query: FilterQuery<any>, data: S): Promise<void>;
  update(query: FilterQuery<any>, data: any): Promise<this>
  getAll(query?: FilterQuery<any>, options?: FindOneOptions): Promise<any[]>;
  get(query: IGetOneQueryFilter, options?: FindOneOptions): Promise<T>;
  beforeDelete(id: ObjectId): Promise<void>;
  delete(id?: any): Promise<this>;
  exists(query: FilterQuery<any>): Promise<boolean>;
  ensureUnique(query: FilterQuery<any>);
  data(key: string, value: any);
  data(key: string): any;
  data(data: S): this;
  data(): S;
  toObject(): any;
}

export interface IAclData extends IDocData {}

export interface IAcl extends IBaseModel<IAcl, IAclData>, IAclData {}

export interface IArchiveData extends IDocData {
  filename?: string;
  namespace?: string;
  md5?: string;
  store_id?: string;
  size?: number;
  files?: string[];
  dateCreated?: Date;
}

export interface IArchive extends IBaseModel<IArchive, IArchiveData>, IArchiveData {
  getHash(files: string[]): string;
  getByFiles(files: string[]): Promise<IArchive>;
}

export interface ICacheData extends IDocData {
  files_id?: string;
  expiresAt?: Date;
  dateCreated?: Date;
}

export interface ICache extends IBaseModel<ICache, ICacheData>, ICacheData {}

export type ClientRole = 'user' | 'admin';

export interface IClientData extends IDocData {
  name?: string;
  role?: ClientRole;
  description?: string;
  clientKey?: string;
  clientSecret?: string;
}

export interface IClient extends IBaseModel<IClient,IClientData>, IClientData {
  generateClientKey(): Promise<string>;
  generateClientSecret(): Promise<string>;
  updateSecret(): Promise<void>;
  updateAuth(): Promise<void>;
  createUrl(options: IClientUrlOptions): string;
}

export interface IDirData extends IDocData {}

export interface IDir extends IBaseModel<IDir, IDirData>, IDirData {}

export interface IFileData extends IDocData {
  namespace?: string;
  filename?: string;
  store_id?: string;
  size?: number;
  md5?: string;
  path?: string;
  contentType?: string;
  aliases?: string[];
  metadata?: any;
  dateStarted?: Date;
  dateUploaded?: Date;
  dateDeleted?: Date;
  isDelete?: boolean;
}
export interface IFile extends IBaseModel<IFile, IFileData>, IFileData {
  openDownloadStream(id: string): Promise<Readable>;
  generateId(): string;
  getStore(): Promise<IFileStore>;
}

export interface IFileStoreData extends IDocData {
  namespace?: string,
  files_id?: string[],
  contentType?: string,
  size?: number,
  md5?: string,
  status?: string,
  metadata?: any,
}

export interface IFileStore extends IBaseModel<IFileStore, IFileStoreData>, IFileStoreData {}

export interface INamespaceStats {
  files: number;
  stores: number;
}

export interface INamespaceData extends IDocData {
  name?: string;
  providers_id?: ObjectId;
  bucket?: string;
  isPublic?: boolean;
  isSystem?: boolean;
  description?: string;
}

export interface IGetUrlOptions extends IUrlOptions {
  processNative?: boolean;
}

export interface INamespace extends IBaseModel<INamespace, INamespaceData>, INamespaceData {
  validProvider(provider, data);
  createByProviderName(data): Promise<INamespace>;
  getBucket(id: string): Promise<any>;
  openUploadStream(options): Promise<Writable>;
  addStore(bucket, info): Promise<IFile>;
  addFile(info): Promise<IFile>;
  openDownloadStream(storeId: string): Promise<Readable>;
  deleteFile(file: string|IFile): Promise<void>;
  truncate(): Promise<void>;
  createArchiveStream(files: string[], options): Promise<Archiver>;
  createArchive(files: string[], name: string): Promise<IArchive>;
  addArchive(info): Promise<IArchive>;
  convert(file: string|IFile, commands: string): Promise<any>;
  getOriginalUrl(file: string|IFile, options: any): Promise<string>;
  getStats(): Promise<INamespaceStats>
}

export interface IProviderData extends IDocData {
  type?: string;
  name?: string;
  description?: string;
  params?: any;
  isSystem?: boolean;
  buckets?: string[];
}

export interface IProvider extends IBaseModel<IProvider, IProviderData>, IProviderData {}

export interface ISnapshotData extends IDocData {
  namespace?: string;
}

export interface ISnapshot extends IBaseModel<ISnapshot, ISnapshotData>, ISnapshotData {}

export interface ISnapshotFileData extends IDocData {
  namespace?: string;
}

export interface ISnapshotFile extends IBaseModel<ISnapshotFile, ISnapshotFileData>, ISnapshotFileData {}

export interface IModels {
  Acl?: IAcl;
  Archive?: IArchive;
  Cache?: ICache;
  Client?: IClient;
  Dir?: IDir;
  File?: IFile;
  FileStore?: IFileStore;
  Namespace?: INamespace;
  Provider?: IProvider;
  Snapshot?: ISnapshot;
  SnapshotFile?: ISnapshotFile;
};
