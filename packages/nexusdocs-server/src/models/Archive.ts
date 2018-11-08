import crypto from 'crypto';
import uuid from 'uuid';

import BaseModel from 'models/BaseModel';
import { IArchive, IArchiveData } from './types';

export default class Archive extends BaseModel<IArchive, IArchiveData> {

  collectionName = 'archives';
  schema = {
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

  getHash(files) {
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
  
  getByFiles(files) {
    const md5 = this.getHash(files);
    return this.get({ md5 });
  }

}
