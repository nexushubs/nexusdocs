import { Readable } from 'stream'
import BaseService from '../BaseService';
import { Cache } from '../../models';

export interface ICacheObject {
  contentType: string;
  stream: Readable;
}

export interface ICacheOptions {
  ttl?: number;
}

export type TCacheBuilder = () => Promise<ICacheObject>;

export interface IFileCacheService extends BaseService {
  initCache(): Promise<void>;
  initFSCache(): Promise<void>;
  updateCache(): Promise<void>;
  cleanUpExpired(): Promise<void>;
  writeStreamToFile(inputStream: Readable, contentType: string): Promise<string>
  clear(): Promise<any>;
  has(key: string): Promise<boolean>;
  isExpired(cache: Cache): Promise<boolean>;
  get(key: string, cacheBuilder?: TCacheBuilder, options?: ICacheOptions): Promise<ICacheObject>;
  unset(key: string): Promise<any>;
  set(key: string, cacheObject: ICacheObject, options?: ICacheOptions): Promise<void>;
}
