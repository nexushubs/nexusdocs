import * as _ from 'lodash';
import { ObjectId, FilterQuery } from 'mongodb';

import { KeyValueMap } from '../../types/common';
import BaseService from '../BaseService';
import providers from './providers';
import { IStoreProvider } from './types';

export default class Store extends BaseService {
  
  private providers: KeyValueMap<IStoreProvider>;

  constructor(options: any) {
    super(options);
    this.providers = {};
  }

  async init() {
  }

  async stop() {
    await Promise.all(_.map(this.providers, provider => provider.destroy()));
  }

  async provider(id: string, forceReload = false) {
    if (!id || !this.providers[id] || forceReload) {
      const { Provider } = this.models;
      const provider = await Provider.get(id);
      const data = provider.data();
      id = data._id.toString();
      this.providers[id] = await this.loadProvider(data);
    }
    return this.providers[id];
  }

  async bucket(providerId: string, bucketName: string) {
    const provider = await this.provider(providerId);
    return provider.bucket(bucketName);
  }

  async drop(id: string) {
    const instance = await this.provider(id);
    if (instance) {
      instance.destroy();
      delete this.providers[id];
    }
  }

  hasType(type: string) {
    return _.has(providers, type);
  }

  async loadProvider(options) {
    const { name, type } = options;
    console.log(`[INFO][Store] provider '${name}' of type ${type}`);
    const providerClasses = providers[type];
    if (!providerClasses) {
      throw new Error(`[ERROR][Store] invalid provider type: ${type}`);
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
