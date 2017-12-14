import BaseModel from '~/lib/base-model';

export default class Snapshot extends BaseModel {

  collectionName = 'snapshots';
  schema = {
    namespace: { type: 'string' },
  };

}
