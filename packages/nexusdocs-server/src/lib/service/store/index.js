import _ from 'lodash';

import BaseService from '~/lib/base-service';
import { loadClasses } from '~/lib/util';

export default class Store extends BaseService {
  
  constructor(...params) {
    super(...params);
    this.providerClasses = {};
    this.providers = {};
  }

  init() {
    super.init();
    this.providerClasses = loadClasses('lib/service/store/providers');
  }

  _stop() {
    return Promise.all(_.map(this.providers, provider => provider.destroy()));
  }

  async provider(id, forceReload) {
    const strId = id.toString();
    if (!this.providers[strId] || forceReload) {
      const Provider = this.model('provider');
      const provider = await Provider.get(id);
      const data = provider.data();
      this.providers[strId] = await this.loadProvider(data);
    }
    return this.providers[strId];
  }

  async bucket(providerId, bucketName) {
    const provider = await this.provider(providerId);
    return provider.bucket(bucketName);
  }

  async drop(id) {
    const instance = await this.get(id);
    if (instance) {
      instance.destroy();
      delete this.providers[id];
    }
  }

  hasType(type) {
    return _.has(this.providerClasses, type);
  }

  async loadProvider(options) {
    const { name, type } = options;
    console.log(`# loading provider '${name}' of type ${type}`);
    const ProviderClass = this.providerClasses[type];
    if (!ProviderClass) {
      throw new Error(`invalid provider type: ${type}`);
    }
    options = {
      ...options,
      path: `lib/service/store/providers/${type}`,
    };
    const instance = new ProviderClass(options);
    if (typeof instance.init === 'function') {
      await instance.init();
    }
    return instance;
  }

}