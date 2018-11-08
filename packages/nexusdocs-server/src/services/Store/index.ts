import _ from 'lodash';
import { ObjectId } from 'mongodb';

import BaseService from 'services/BaseService';
import { loadClasses } from 'lib/util';
import providers from './providers';

export default class Store extends BaseService {
  
  private providers: any;

  constructor(options: any) {
    super(options);
    this.providers = {};
  }

  async init() {
  }

  async stop() {
    await Promise.all(_.map(this.providers, provider => provider.destroy()));
  }

  async provider(providerQuery: any, forceReload = false) {
    let strId;
    if (providerQuery instanceof ObjectId) {
      strId = providerQuery.toHexString();
    }
    if (!strId || !this.providers[strId] || forceReload) {
      const { Provider } = this.models;
      const provider = await Provider.get(providerQuery);
      const data = provider.data();
      strId = data._id.toString();
      this.providers[strId] = await this.loadProvider(data);
    }
    return this.providers[strId];
  }

  async bucket(providerQuery: any, bucketName: string) {
    const provider = await this.provider(providerQuery);
    return provider.bucket(bucketName);
  }

  async drop(id) {
    const instance = await this.provider(id);
    if (instance) {
      instance.destroy();
      delete this.providers[id];
    }
  }

  hasType(type) {
    return _.has(providers, type);
  }

  async loadProvider(options) {
    const { name, type } = options;
    console.log(`# loading provider '${name}' of type ${type}`);
    const providerClasses = providers[type];
    if (!providerClasses) {
      throw new Error(`invalid provider type: ${type}`);
    }
    const { Provider, Bucket } = providerClasses;
    options = {
      ...options,
      Bucket,
    };
    const instance = new Provider(options);
    if (typeof instance.init === 'function') {
      await instance.init();
    }
    return instance;
  }

}
