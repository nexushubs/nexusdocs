import * as _ from 'lodash';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import * as boolean from 'boolean';
import * as mime from 'mime-types';
import * as _mkdirp from 'mkdirp';
import * as uuid from 'uuid';
import { Readable } from 'stream';

import { IFileContent } from '../../types/file';
import { Namespace, Cache } from '../../models';
import { promisifyStream } from '../../lib/util';
import { IFileUploadInfo } from '../Store/types';
import BaseService from '../BaseService';
import { ICacheOptions, IFileCacheService, TCacheBuilder } from './types';

const mkdirp = util.promisify(_mkdirp);

// The namespace FileCache uses
const CACHE_NAMESPACE = 'nexusdocs.cache';
// Mem cache life cycle in seconds
const MEM_CACHE_EXPIRES = 60;
// Mem cache updater interval in seconds
const UPDATE_CACHE_INTERVAL = 10 * 60; // 10 minutes

export default class FileCache extends BaseService implements IFileCacheService {

  private memCaches: Map<string, { timestamp: number, promise: Promise<IFileContent>}> = new Map();
  private memCacheTimer = null;
  private tempDir: string;
  private namespace: Namespace;

  async init() {
    const { Namespace } = this.models;
    const { clearOnStartup } = this.options;
    const namespace = await Namespace.get({ name: CACHE_NAMESPACE });
    if (!namespace) {
      throw new Error(`FileCache: namespace '${CACHE_NAMESPACE}' is not found!`);
    }
    this.namespace = namespace;
    if (boolean(clearOnStartup)) {
      this.clear();
    }
    return this.initCache();
  }

  async stop() {
    clearInterval(this.memCacheTimer)
  }

  async initCache() {
    await this.initFSCache();
    const {
      updateCacheInterval = UPDATE_CACHE_INTERVAL
    } = this.options; 
    this.memCacheTimer = setInterval(() => {
      this.updateCache();
    }, updateCacheInterval * 1000);
    return this.updateCache();
  }

  initFSCache() {
    const tempDir = `${os.tmpdir()}/nexusdocs/file-cache`;
    this.tempDir = tempDir;
    return mkdirp(tempDir);
  }
  
  updateCache() {
    return this.cleanUpExpired();
  }

  async cleanUpExpired() {
    const { namespace } = this;
    const { Cache } = this.models;
    const now = new Date();
    const query = {
      expiresAt: { $lt: now },
    };
    console.log('# FileCache: cleaning up expired cache...');
    const expiredCaches = await Cache.collection.find(query, { projection: { value: 1 } }).toArray();
    for (const cache of expiredCaches) {
      await namespace.deleteFile(cache.value);
    }
    await Cache.collection.deleteMany(query),
    console.log(`# FileCache: ${expiredCaches.length} removed`);
  }

  async writeStreamToFile(inputStream: Readable, contentType: string) {
    const filePath = path.normalize(`${this.tempDir}/${uuid.v4()}.${mime.extension(contentType)}`);
    const fileStream = fs.createWriteStream(filePath);
    inputStream.pipe(fileStream);
    return promisifyStream(fileStream)
    .then(() => filePath);
  }

  async clear() {
    const { namespace } = this;
    const { Cache, File, FileStore } = this.models;
    const bucket = await namespace.getBucket(null);
    return Promise.all([
      Cache.collection.deleteMany({}),
      File.collection.deleteMany({ namespace: CACHE_NAMESPACE }),
      FileStore.collection.deleteMany({ namespace: CACHE_NAMESPACE }),
      bucket.truncate(),
    ]).then(() => {
      console.log(`# FileCache: cache cleared!`);
    });
  }

  async has(key: string) {
    const { Cache } = this.models;
    const cache = await Cache.get(key);
    if (!cache) {
      return false;
    }
    const expired = await this.isExpired(cache);
    return !expired;
  }

  async isExpired(cache: Cache) {
    if (!cache) {
      return true;
    }
    if (!cache.expiresAt) {
      return false;
    }
    const now = new Date;
    if (now > cache.expiresAt) {
      await this.unset(cache);
      return true;
    }
    return false;
  }

  getCacheKey(key: string) {
    return `file-cache:${key}`;
  }

  async get(key: string, cacheBuilder: TCacheBuilder = null, options: ICacheOptions = {}) {
    const { namespace, memCaches } = this;
    const { Cache, File } = this.models;
    key = this.getCacheKey(key);
    if (memCaches.has(key)) {
      const { promise } = memCaches.get(key);
      return promise;
    }
    const cache = await Cache.get(key);
    const expired = await this.isExpired(cache);
    if (!expired) {
      const file = await File.get(cache.value);
      const downloadStream = await namespace.openDownloadStream(file.store_id);
      return {
        stream: downloadStream,
        contentType: file.contentType,
        filename: file.filename,
      };
    }
    if (!_.isFunction(cacheBuilder)) {
      return null;
    }
    const cachePromise = cacheBuilder();
    memCaches.set(key, {
      timestamp: Date.now(),
      promise: cachePromise,
    });
    const cacheObject = await cachePromise;
    memCaches.delete(key);
    this.set(key, cacheObject, options);
    return cacheObject;
  }

  async unset(key: string | Cache) {
    const { namespace } = this;
    const { Cache } = this.models;
    let cache: Cache;
    if (typeof key === 'string') {
      cache = await Cache.get(key);
    } else {
      cache = key;
    }
    if (!cache) {
      return;
    }
    return Promise.all([
      namespace.deleteFile(cache.value),
      Cache.delete(cache.key),
    ]);
  }

  /**
   * Set cache by stream
   */
  async set(key: string, cacheObject: IFileContent, options: ICacheOptions = { ttl: 0 }) {
    const { namespace, memCaches } = this;
    const { Cache } = this.models;
    const { stream, contentType, filename } = cacheObject;
    const { ttl } = options;
    key = this.getCacheKey(key);
    const uploadStream = await namespace.openUploadStream({ contentType, filename });
    let expiresAt: Date = undefined;
    const now = new Date;
    if (ttl) {
      expiresAt = new Date;
      expiresAt.setSeconds(expiresAt.getSeconds() + ttl);
    }
    const promise: Promise<void> = new Promise((resolve, reject) => {
      stream.pipe(uploadStream);
      uploadStream.on('file', async (file: IFileUploadInfo) => {
        const data = {
          value: file.files_id,
          expiresAt,
          timestamp: now,
        };
        await Cache.collection.updateOne({ key }, { $set: data }, { upsert: true });
        this.memCaches.delete(key);
        resolve();
      });
      uploadStream.on('error', err => {
        console.error(err);
        reject(err);
      });
    });
    memCaches.set(key, {
      timestamp: +new Date,
      promise: promise.then(() => this.get(key)),
    });
    await promise;
  }

}
