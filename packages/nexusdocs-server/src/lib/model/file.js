import BaseModel from '~/lib/base-model';
import uuid from 'uuid';

export default class File extends BaseModel {

  name = 'files';
  schema = {
    namespace: { type: 'string' },
    filename: { type: 'string' },
    store_id: { type: 'string' },
    size: { type: 'integer' },
    md5: { type: 'string' },
    path: { type: 'string', optional: true },
    contentType: { type: 'string' },
    aliases: { type: 'array', items: { type: 'string' } },
    startDate: { type: 'date' },
    uploadDate: { type: 'date' },
    isDelete: { type: 'boolean' },
    metadata: { type: 'object' },
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

}
