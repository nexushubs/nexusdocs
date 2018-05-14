import BaseModel from 'lib/base-model';

export default class Acl extends BaseModel {

  collectionName = 'clients';
  schema = {
    clients_id: { type: 'string' },
    target: { type: 'string' },
    namespace: { type: 'string' },
    files_id: { type: 'string' },
  };
  defaultProjection = {
  };
  
}
