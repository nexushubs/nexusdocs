import * as _ from 'lodash';

import BaseModel from '../models/BaseModel';
import { IBaseData } from './types';

export interface CacheData extends IBaseData {
  key: string;
  value: string;
  expiresAt?: Date;
  dateCreated?: Date;
}

class Cache extends BaseModel<Cache, CacheData> {
  
  static collectionName = 'caches';
  static schema = {
    value: { type: 'string' },
    expiresAt: { type: ['date', null] },
    dateCreated: { type: 'date' },
  };
  static validators = {
  };

}

interface Cache extends CacheData {}

export default Cache
