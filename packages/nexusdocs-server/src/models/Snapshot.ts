import BaseModel from './BaseModel';
import { IBaseData } from './types';

export interface SnapshotData extends IBaseData {
  namespace: string;
}

class Snapshot extends BaseModel<Snapshot, SnapshotData> {

  static collectionName = 'docs.snapshots';
  static schema = {
    namespace: { type: 'string' },
  };

}

interface Snapshot extends SnapshotData {}

export default Snapshot;
