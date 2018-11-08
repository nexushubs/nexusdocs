import { IAcl, IArchive, ICache, IClient, IDir, IFile, IFileStore, INamespace, IProvider, ISnapshot, ISnapshotFile, IModels } from "models/types";

export interface ApplicationOptions {
  database?: string;
  restful?: {
    enabled?: boolean;
    hostname?: string;
    port?: number;
    trustedProxy?: string;
    serverUrl?: string;
  };
  debug?: {
    request?: boolean;
  };
}

export interface IBase {
  models: IModels;
}
