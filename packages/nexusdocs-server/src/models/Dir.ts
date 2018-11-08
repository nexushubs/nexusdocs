import BaseModel from '../models/BaseModel';
import { IDirData, IDir } from './types';

export default class Dir extends BaseModel<IDir, IDirData> {

  collectionName = 'files';
  schema = {
    namespace: { type: 'string' },
    path: { type: 'string' },
    name: { type: 'string' },
  };

}
