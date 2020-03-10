import { Collection, FindOneOptions } from 'mongodb';
import BaseModel from './BaseModel';
import EsIndex from './EsIndex';
import { Validator } from '../lib/validator';

import {
  Acl,
  Archive,
  Cache,
  Client,
  Dir,
  File,
  FileStore,
  Namespace,
  Provider,
  Snapshot,
  SnapshotFile,
} from '.';

export interface IBaseData {
  _id: string;
}

export interface IBaseModelStatic<T extends BaseModel<T, S, C>, S extends IBaseData, C> {
  new(): BaseModel<T, S, C>;
  initialized?: boolean;
  config: C;
  collectionName: string;
  collection: Collection<S>;
  defaultQueryOptions: FindOneOptions;
  schema?: {
    [P in keyof S]: {
      [key: string]: any,
    };
  };
  esSync?: boolean;
  es?: EsIndex<S>;
  validatorPlugins: {[key: string]: any};
  validator: Validator;
  validators: {[key: string]: any};
}

export interface IModels {
  Acl?: Acl;
  Archive?: Archive;
  Cache?: Cache;
  Client?: Client;
  Dir?: Dir;
  File?: File;
  FileStore?: FileStore;
  Namespace?: Namespace;
  Provider?: Provider;
  Snapshot?: Snapshot;
  SnapshotFile?: SnapshotFile;
};
