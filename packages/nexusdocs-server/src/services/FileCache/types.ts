import { Readable } from 'stream'
import { IFileContent } from '../../types/file';
import { Cache } from '../../models';
import BaseService from '../BaseService';

export interface ICacheOptions {
  ttl?: number;
}

export type TCacheBuilder = () => Promise<IFileContent>;

export interface IFileCacheService extends BaseService {
  initCache(): Promise<void>;
  initFSCache(): Promise<void>;
  updateCache(): Promise<void>;
  cleanUpExpired(): Promise<void>;
  writeStreamToFile(inputStream: Readable, contentType: string): Promise<string>
  clear(): Promise<any>;
  has(key: string): Promise<boolean>;
  isExpired(cache: Cache): Promise<boolean>;
  get(key: string, cacheBuilder?: TCacheBuilder, options?: ICacheOptions): Promise<IFileContent>;
  unset(key: string): Promise<any>;
  set(key: string, cacheObject: IFileContent, options?: ICacheOptions): Promise<void>;
}
