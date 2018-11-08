import BaseModel from '../models/BaseModel';
import { ISnapshotFile, ISnapshotFileData } from './types';

export default class SnapshotFile extends BaseModel<ISnapshotFile, ISnapshotFileData> {

  collectionName = 'snapshots';
  schema = {
    namespace: { type: 'string' },
  };

}
