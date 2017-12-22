import _ from 'lodash';
import filenamify from 'filenamify';
import { PassThrough } from 'stream';

import BaseService from '~/lib/base-service';
import { ApiError } from '~/lib/errors';

// The namespace FileCache uses
const CACHE_NAMESPACE = 'nexusdocs.cache';
// Mem cache life cycle in seconds
const MEM_CACHE_EXPIRES = 10;
// Mem cache updater interval in seconds
const UPDATE_CACHE_INTERVAL = 10 * 60; // 10 minutes

export default class FileCache extends BaseService {

  memCaches = new Map();
  memCacheTimer = null;

  async init() {
    const { Namespace } = this.model();
    const { clearOnStartUp } = this.options;
    const namespace = await Namespace.get({ name: CACHE_NAMESPACE });
    if (!namespace) {
      throw new Error(`FileCache: namespace '${CACHE_NAMESPACE}' is not found!`);
    }
    this.namespace = namespace;
    if (clearOnStartUp) {
      this.clear();
    }
    return this.initCache();
  }

  initCache() {
    this.memCacheTimer = setInterval(() => {
      this.updateCache();
    }, UPDATE_CACHE_INTERVAL * 1000);
    return this.updateCache();
  }

  updateCache() {
    const { memCaches } = this;
    const expired = (new Date).valueOf() - MEM_CACHE_EXPIRES * 1000;
    _.each(memCaches, (cache, key) => {
      if (cache.dateCreated > expired) {
        memCaches.delete(key);
      }
    });
    return this.cleanUpExpired();
  }

  async cleanUpExpired() {
    const { namespace } = this;
    const { Cache, File, FileStore } = this.model();
    const now = new Date();
    const query = {
      expireAt: { $lt: now },
    };
    console.log('# FileCache: cleaning up expired cache...');
    const expiredCaches = await Cache.collection.find(query, { files_id: 1 }).toArray();
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

  async clear() {
    const { namespace } = this;
    const { Cache, File, FileStore } = this.model();
    const bucket = await namespace.getBucket();
    return Promise.all([
      Cache.collection.remove({}),
      File.collection.remove({ namespace: CACHE_NAMESPACE }),
      FileStore.collection.remove({ namespace: CACHE_NAMESPACE }),
      bucket.truncate(),
    ]).then(() => {
      console.log(`# FileCache: cache cleared!`);
    });
  }

  async has(key) {
    const { Cache } = this.model();
    const cache = await Cache.get(key);
    if (!cache) {
      return false;
    }
    const expired = await isExpired(cache);
    return !expired;
  }

  async isExpired(cache) {
    if (!cache) {
      return true;
    }
    if (!cache.ttl) {
      return false;
    }
    const now = (new Date).valueOf();
    const expiresAt = cache.dateCreated.valueOf() + cache.ttl * 1000;
    if (now > expiresAt) {
      await this.unset(cache);
      return true;
    }
    return false;
  }

  async get(key, buildCache, options) {
    const { namespace, memCaches } = this;
    const { Cache, File } = this.model();
    const { Store } = this.service();
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
    if (!_.isFunction(buildCache)) {
      return null;
    }
    const cachePromise = buildCache();
    memCaches.set(key, {
      dateCreated: new Date,
      promise: cachePromise,
    });
    const cacheObject = await cachePromise;
    memCaches.delete(key);
    this.set(key, cacheObject, options);
    return cacheObject;
  }

  async unset(key) {
    const { namespace } = this;
    const { Cache, File } = this.model();
    let cache;
    if (key instanceof Cache) {
      cache = key;
    } else {
      cache = await Cache.get(key);
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
   * @param {string} key 
   * @param {stream.Readable} stream 
   * @param {object} options 
   * @param {number} options.ttl - Life cycle 
   */
  async set(key, cacheObject, options = {}) {
    const { namespace } = this;
    const { Cache } = this.model();
    const { contentType, stream } = cacheObject;
    const { ttl } = options;
    const uploadStream = await namespace.openUploadStream({ contentType });
    stream.pipe(uploadStream);
    let expireAt;
    const now = new Date;
    if (ttl) {
      expireAt = new Date;
      expireAt.setSeconds(expireAt.getSeconds() + ttl);
    }
    uploadStream.on('file', file => {
      const data = {
        files_id: file.files_id,
        expireAt,
        dateCreated: now,
      };
      Cache.collection.update({ _id: key}, data, { upsert: true });
    });
    uploadStream.on('error', console.error);
  }

}
