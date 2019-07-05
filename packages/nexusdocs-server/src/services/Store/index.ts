import * as _ from 'lodash';
import { ObjectId, FilterQuery } from 'mongodb';

import { KeyValueMap } from '../../types/common';
import BaseService from '../BaseService';
import providers from './providers';
import { IStoreProvider } from './types';

export type ProviderQuery = string | ObjectId;

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

  async provider(providerQuery: ProviderQuery, forceReload = false) {
    let strId: string;
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

  async bucket(providerQuery: ProviderQuery, bucketName: string) {
    const provider = await this.provider(providerQuery);
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
