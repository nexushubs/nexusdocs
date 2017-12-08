import BaseModel from '~/lib/base-model';

export default class Client extends BaseModel {

  name = 'clients';
  schema = {
    clientKey: { type: 'string' },
    clientSecret: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
  };
  defaultProjection = {
    clientSecret: 0,
  }
  
}
