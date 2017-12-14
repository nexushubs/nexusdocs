import BaseModel from '~/lib/base-model';

export default class SnapshotFile extends BaseModel {

  collectionName = 'snapshots';
  schema = {
    namespace: { type: 'string' },
  };

}
