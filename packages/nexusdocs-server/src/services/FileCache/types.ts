import { Readable } from 'stream'
import { ICache } from 'models/types';
import { IBaseService } from 'services/types';

export interface ICacheObject {
  contentType: string;
  stream: Readable;
}

export interface ICacheOptions {
  ttl?: number;
}

export type TCacheBuilder = () => Promise<ICacheObject>;

export interface IFileCacheService extends IBaseService {
  initCache(): Promise<void>;
  initFSCache(): Promise<void>;
  updateCache();
  cleanUpExpired(): Promise<void>;
  writeStreamToFile(inputStream: Readable, contentType: string): Promise<string>
  clear(): Promise<any>;
  has(key: string): Promise<boolean>;
  isExpired(cache: ICache): Promise<boolean>;
  get(key: string, cacheBuilder?: TCacheBuilder, options?: ICacheOptions): Promise<ICacheObject>;
  unset(key: string): Promise<any>;
  set(key: string, cacheObject: ICacheObject, options?: ICacheOptions): Promise<void>;
}
