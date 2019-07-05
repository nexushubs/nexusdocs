import BaseModel from './BaseModel';
import { IBaseData } from './types';

export interface FileStoreData extends IBaseData {
  namespace?: string,
  files_id?: string[],
  contentType?: string,
  size?: number,
  md5?: string,
  status?: string,
  metadata?: any,
}

class FileStore extends BaseModel<FileStore, FileStoreData> {

  static collectionName = 'files.store';
  static schema = {
    namespace: { type: 'string' },
    files_id: { type: 'array', items: { type: 'string', optional: true } },
    contentType: { type: 'string' },
    md5: { type: 'string' },
    status: { type: 'string' },
    metadata: { type: 'object' },
  };
  static esSync = true;

}

interface FileStore extends FileStoreData {}

export default FileStore;
