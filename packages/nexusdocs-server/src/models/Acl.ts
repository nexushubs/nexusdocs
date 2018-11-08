import BaseModel from 'models/BaseModel';
import { IAcl, IAclData } from './types';

export default class Acl extends BaseModel<IAcl, IAclData> {

  collectionName = 'clients';
  schema = {
    clients_id: { type: 'string' },
    target: { type: 'string' },
    namespace: { type: 'string' },
    files_id: { type: 'string' },
  };
  defaultQueryOptions = {
  };
  
}
