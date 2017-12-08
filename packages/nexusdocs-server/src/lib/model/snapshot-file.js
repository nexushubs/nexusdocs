import BaseModel from '~/lib/base-model';

export default class SnapshotFile extends BaseModel {

  name = 'snapshots';
  schema = {
    namespace: { type: 'string' },
  };

}
