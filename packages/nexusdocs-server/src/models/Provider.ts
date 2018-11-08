import BaseModel from '../models/BaseModel';
import { providerType, bucketName } from '../lib/schema';
import { ObjectId } from 'bson';
import { IProvider, IProviderData } from './types';

export default class Provider extends BaseModel<IProvider, IProviderData> {

  collectionName = 'providers';
  schema = {
    type: { type: 'string', $providerType: 1 },
    name: { type: 'string', pattern: 'alphaNumeric' },
    description: { type: 'string', optional: true },
    params: { type: 'object' },
    isSystem: { type: 'boolean', optional: true },
    buckets: { type: 'array', items: {
      type: 'string', $bucketName: 1 },
    },
  };
  validators = {
    providerType,
    bucketName,
  };
  defaultQueryOptions = {
  }
  
  beforeCreate(data) {
    return this.ensureUnique({name: data.name});
  }

  beforeUpdate(id: ObjectId, data: any) {
    return this.ensureUnique({name: data.name});
  }

}
