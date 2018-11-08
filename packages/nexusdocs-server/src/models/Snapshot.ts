import BaseModel from 'models/BaseModel';
import { ISnapshot, ISnapshotData } from './types';

export default class Snapshot extends BaseModel<ISnapshot, ISnapshotData> {

  collectionName = 'snapshots';
  schema = {
    namespace: { type: 'string' },
  };

}
