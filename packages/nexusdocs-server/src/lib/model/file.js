import BaseModel from 'lib/base-model';
import uuid from 'uuid';

export default class File extends BaseModel {

  collectionName = 'files';
  schema = {
    namespace: { type: 'string' },
    filename: { type: 'string' },
    store_id: { type: 'string' },
    size: { type: 'integer' },
    md5: { type: 'string' },
    path: { type: 'string', optional: true },
    contentType: { type: 'string' },
    aliases: { type: 'array', items: { type: 'string' } },
    metadata: { type: 'object' },
    dateStarted: { type: 'date' },
    dateUploaded: { type: 'date' },
    dateDeleted: { type: 'date', optional: true },
    isDelete: { type: 'boolean' },
  };

  async openDownloadStream(id) {
    const { Namespace, FileStore } = this.model();
    const { Store } = this.service();
    // await this.collection.findOne()
    // const namespaceDoc = 
    // const fileDoc = this.find();

  }

  generateId() {
    return uuid.v4();
  }

  getStore() {
    const { FileStore } = this.model();
    return FileStore.get(this.store_id);
  }

}
