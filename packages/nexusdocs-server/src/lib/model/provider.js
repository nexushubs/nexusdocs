import BaseModel from 'lib/base-model';
import { providerType, bucketName } from 'lib/schema';

export default class Provider extends BaseModel {

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
  defaultProjection = {
  }
  
  beforeCreate(data) {
    return this.ensureUnique({name: data.name});
  }

  beforeUpdate(id, data) {
    return this.ensureUnique({name: data.name}, id);
  }

}
