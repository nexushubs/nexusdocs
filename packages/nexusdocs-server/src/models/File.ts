import BaseModel from '../models/BaseModel';
import * as uuid from 'uuid';
import { IBaseData } from './types';

export interface FileData extends IBaseData {
  namespace?: string;
  filename?: string;
  store_id?: string;
  size?: number;
  md5?: string;
  path?: string;
  contentType?: string;
  aliases?: string[];
  metadata?: any;
  dateStarted?: Date;
  dateUploaded?: Date;
  dateDeleted?: Date;
  isDelete?: boolean;
}

class File extends BaseModel<File, FileData> {

  static collectionName = 'docs.files';
  static schema = {
    namespace: { type: 'string' },
    filename: { type: 'string' },
    store_id: { type: 'string' },
    size: { type: 'integer' },
    md5: { type: 'string' },
    path: { type: ['string', null], optional: true },
    contentType: { type: 'string' },
    aliases: { type: 'array', items: { type: 'string' } },
    metadata: { type: 'object' },
    dateStarted: { type: 'date' },
    dateUploaded: { type: 'date' },
    dateDeleted: { type: 'date', optional: true },
    isDelete: { type: 'boolean' },
  };
  static esSync = true;

  async openDownloadStream(id) {
    const { Namespace, FileStore } = this.models;
    const { Store } = this.services;
    // await this.collection.findOne()
    // const namespaceDoc = 
    // const fileDoc = this.find();

  }

  generateId() {
    return uuid.v4();
  }

  getStore() {
    const { FileStore } = this.models;
    return FileStore.get(this.data('store_id'));
  }

}

interface File extends FileData {}

export default File;
