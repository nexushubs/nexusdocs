import _ from 'lodash';

import BaseModel from 'models/BaseModel';
import { ICache, ICacheData } from './types';

export default class Cache extends BaseModel<ICache, ICacheData> {
  
  collectionName = 'caches';
  schema = {
    files_id: { type: 'string' },
    expiresAt: { type: 'date' },
    dateCreated: { type: 'date' },
  };
  validators = {
  };

}
