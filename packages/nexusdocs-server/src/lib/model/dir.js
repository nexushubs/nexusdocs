import BaseModel from '~/lib/base-model';

export default class Dir extends BaseModel {

  name = 'files';
  schema = {
    namespace: { type: 'string' },
    path: { type: 'string' },
    name: { type: 'string' },
  };

}
