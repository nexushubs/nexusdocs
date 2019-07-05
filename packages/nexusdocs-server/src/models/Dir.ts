import BaseModel from '../models/BaseModel';
import { IBaseData } from './types';

export interface DirData extends IBaseData {
  namespace: string;
  path: string;
  name: string;
}

class Dir extends BaseModel<Dir, DirData> {

  static collectionName = 'files';
  static schema = {
    namespace: { type: 'string' },
    path: { type: 'string' },
    name: { type: 'string' },
  };

}

interface Dir extends DirData {}

export default Dir;
