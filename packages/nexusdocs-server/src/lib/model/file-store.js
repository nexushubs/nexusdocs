import BaseModel from '~/lib/base-model';

export default class FileStore extends BaseModel {

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
