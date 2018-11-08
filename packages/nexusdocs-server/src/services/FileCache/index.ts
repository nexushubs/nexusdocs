import _ from 'lodash';
import fs from 'fs';
import os from 'os';
import path from 'path';
import util from 'util';
import boolean from 'boolean';
import mime from 'mime-types';
import _mkdirp from 'mkdirp';
import uuid from 'uuid';
import { PassThrough, Readable } from 'stream';

import BaseService from 'services/BaseService';
import { ApiError } from 'lib/errors';
import { promisifyStream } from 'lib/util';
import { ICacheObject, ICacheOptions, IFileCacheService, TCacheBuilder } from './types';
import { INamespace, ICache } from 'models/types';

const mkdirp = util.promisify(_mkdirp);

// The namespace FileCache uses
const CACHE_NAMESPACE = 'nexusdocs.cache';
// Mem cache life cycle in seconds
const MEM_CACHE_EXPIRES = 10;
// Mem cache updater interval in seconds
const UPDATE_CACHE_INTERVAL = 10 * 60; // 10 minutes

export default class FileCache extends BaseService implements IFileCacheService {

  private memCaches: Map<string, { timestamp: number, promise: Promise<any>}> = new Map();
  private memCacheTimer = null;
  private tempDir: string;
  private namespace: INamespace;

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
    const { memCaches } = this;
    const expiresAfter = Date.now() - MEM_CACHE_EXPIRES * 1000;
    memCaches.forEach((cache, key) => {
      if (cache.timestamp > expiresAfter) {
        memCaches.delete(key);
      }
    });
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
    const expiredCaches = await Cache.collection.find(query, { projection: { files_id: 1 } }).toArray();
    const cleanFilePromise = expiredCaches.reduce((promise, cache) => {
      return promise.then(() => namespace.deleteFile(cache.files_id));
    }, Promise.resolve());
    return Promise.all([
      cleanFilePromise,
      Cache.collection.remove(query),
    ]).then(() => {
      console.log(`# FileCache: ${expiredCaches.length} removed`);
    });
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
      Cache.collection.remove({}),
      File.collection.remove({ namespace: CACHE_NAMESPACE }),
      FileStore.collection.remove({ namespace: CACHE_NAMESPACE }),
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

  async isExpired(cache: ICache) {
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

  async get(key: string, cacheBuilder: TCacheBuilder = null, options: ICacheOptions = {}) {
    const { namespace, memCaches } = this;
    const { Cache, File } = this.models;
    const { Store } = this.services;
    if (memCaches.has(key)) {
      const { promise } = memCaches.get(key);
      return promise;
    }
    const cache = await Cache.get(key);
    const expired = await this.isExpired(cache);
    if (!expired) {
      const file = await File.get(cache.files_id);
      const downloadStream = await namespace.openDownloadStream(file.store_id);
      return {
        contentType: file.contentType,
        stream: downloadStream,
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
    return cachePromise.then(cacheObject => {
      memCaches.delete(key);
      this.set(key, cacheObject, options);
      return cacheObject;
    });
  }

  async unset(key: string|ICache) {
    const { namespace } = this;
    const { Cache, File } = this.models;
    let cache;
    if (typeof key === 'string') {
      cache = await Cache.get(key);
    } else {
      cache = key;
    }
    if (!cache) {
      return;
    }
    return Promise.all([
      namespace.deleteFile(cache.files_id),
      Cache.delete(cache._id),
    ]);
  }

  /**
   * Set cache by stream
   */
  async set(key, cacheObject: ICacheObject, options: ICacheOptions = { ttl: 0 }) {
    const { namespace } = this;
    const { Cache } = this.models;
    const { contentType, stream } = cacheObject;
    const { ttl } = options;
    const uploadStream = await namespace.openUploadStream({ contentType });
    stream.pipe(uploadStream);
    let expiresAt;
    const now = new Date;
    if (ttl) {
      expiresAt = new Date;
      expiresAt.setSeconds(expiresAt.getSeconds() + ttl);
    }
    uploadStream.on('file', file => {
      const data = {
        files_id: file.files_id,
        expiresAt,
        timestamp: now,
      };
      Cache.collection.update({ _id: key}, data, { upsert: true });
    });
    uploadStream.on('error', console.error);
  }

}
