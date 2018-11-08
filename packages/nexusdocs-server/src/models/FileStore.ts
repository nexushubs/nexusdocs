import BaseModel from '../models/BaseModel';
import { IFileStore, IFileStoreData } from './types';

export default class FileStore extends BaseModel<IFileStore, IFileStoreData> {

  collectionName = 'files.store';
  schema = {
    namespace: { type: 'string' },
    files_id: { type: 'array', items: { type: 'string', optional: true } },
    contentType: { type: 'string' },
    md5: { type: 'string' },
    status: { type: 'string' },
    metadata: { type: 'object' },
  };

  findFromNamespace(namespace, files_id, filename) {

  }

}
