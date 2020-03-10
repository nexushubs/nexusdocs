import BaseModel from './BaseModel';
import { IBaseData } from './types';

export interface SnapshotFileData extends IBaseData {
  namespace: string;
}

class SnapshotFile extends BaseModel<SnapshotFile, SnapshotFileData> {

  static collectionName = 'docs.snapshots';
  static schema = {
    namespace: { type: 'string' },
  };

}

interface SnapshotFile extends SnapshotFileData {}

export default SnapshotFile;
