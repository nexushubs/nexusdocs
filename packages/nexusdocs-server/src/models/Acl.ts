import BaseModel from './BaseModel';
import { IBaseData } from './types';

export interface AclData extends IBaseData {
  filename?: string;
  namespace?: string;
  md5?: string;
  store_id?: string;
  size?: number;
  files?: string[];
  dateCreated?: Date;
}

class Acl extends BaseModel<Acl, AclData> {

  static collectionName = 'clients';
  static schema = {
    clients_id: { type: 'string' },
    target: { type: 'string' },
    namespace: { type: 'string' },
    files_id: { type: 'string' },
  };
  static defaultQueryOptions = {
  };
  
}

interface Acl extends AclData {}

export default Acl
