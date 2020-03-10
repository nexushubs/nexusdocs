import * as crypto from 'crypto';
import * as uuid from 'uuid';

import BaseModel from '../models/BaseModel';
import { IBaseData } from './types';

export interface ArchiveData extends IBaseData {
  filename?: string;
  namespace?: string;
  md5?: string;
  store_id?: string;
  size?: number;
  files?: string[];
  dateCreated?: Date;
}

class Archive extends BaseModel<Archive, ArchiveData> {

  static collectionName = 'docs.archives';
  static schema = {
    filename: { type: 'string' },
    namespace: { type: 'string' },
    md5: { type: 'string' },
    store_id: { type: 'string' },
    size: { type: 'number' },
    files: { type: 'object',
      properties: { type: 'string' },
    },
    dateCreated: { type: 'date' },
  };

  getHash(files: string[]) {
    const hash = crypto.createHash('md5');
    files.sort();
    files.forEach(fileId => {
      hash.update(fileId);
    });
    return hash.digest('hex');
  }

  async beforeCreate(data: any) {
    data._id = uuid.v4();
    data.md5 = this.getHash(data.files);
    data.dateCreated = new Date;
  }
  
  getByFiles(files: string[]) {
    const md5 = this.getHash(files);
    return this.get({ md5 });
  }

}

interface Archive extends ArchiveData {}

export default Archive;
