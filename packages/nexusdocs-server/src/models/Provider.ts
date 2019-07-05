import BaseModel from './BaseModel';
import { providerType, bucketName } from '../lib/schema';
import { IBaseData } from './types';

export interface ProviderData extends IBaseData {
  type?: string;
  name?: string;
  description?: string;
  params?: any;
  isSystem?: boolean;
  buckets?: string[];
}

class Provider extends BaseModel<Provider, ProviderData> {

  static collectionName = 'providers';
  static schema = {
    type: { type: 'string', $providerType: 1 },
    name: { type: 'string', pattern: 'alphaNumeric' },
    description: { type: 'string', optional: true },
    params: { type: 'object' },
    isSystem: { type: 'boolean', optional: true },
    buckets: { type: 'array', items: {
      type: 'string', $bucketName: 1 },
    },
  };
  static validators = {
    providerType,
    bucketName,
  };
  static defaultQueryOptions = {
  }
  
  async beforeCreate(data: Partial<ProviderData>) {
    if (data.name) {
      await this.ensureUnique({ name: data.name });
    }
  }

  async beforeUpdate(data: Partial<ProviderData>) {
    if (data.name) {
      await this.ensureUnique({ name: data.name });
    }
  }

}

interface Provider extends ProviderData {}

export default Provider;
