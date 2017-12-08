import EventEmitter from 'events';

import { loadClass } from '~/lib/util';

export default class BaseProvider extends EventEmitter {

  constructor(options) {
    super();
    this.validOptions(options);
    this.options = options;
    this.name = options.name;
    this.buckets = {};
  }

  validOptions(options) {
    const validator = this.constructor.validOptions;
    if (typeof validator === 'function') {
      this.constructor.validOptions(options);
    }
  }

  destroy() {
    if (this._destroy) {
      return this._destroy();
    }
  }

  async bucket(bucketName) {
    const { buckets } = this.options;
    if (!buckets.includes(bucketName)) {
      throw new Error('invailid bucket name');
    }
    if (!this.buckets[bucketName]) {
      const BucketClass = loadClass(`${this.options.path}/bucket`);
      const instance = new BucketClass(this, bucketName);
      if (typeof instance.init === 'function') {
        await instance.init();
      }
      this.buckets[bucketName] = instance;
    }
    return this.buckets[bucketName];
  }

  destroy() {
    return true;
  }
  
}
