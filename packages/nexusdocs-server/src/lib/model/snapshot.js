import BaseModel from '~/lib/base-model';

export default class Snapshot extends BaseModel {

  name = 'snapshots';
  schema = {
    namespace: { type: 'string' },
  };

}
