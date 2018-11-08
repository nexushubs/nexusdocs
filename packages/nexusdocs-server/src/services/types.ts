import { IBase } from "types";
import { IFileCacheService } from "./FileCache/types";
import { IFileConverterService } from "./FileConverter/types";
import { IFileParserService } from "./FileParser/types";
import { IResumableService } from "./Resumable/types";
import { IStoreService } from "./Store/types";

export interface IBaseService extends IBase {
  init(options: any): Promise<any>;
  stop(): Promise<any>;
}

export interface IServices {
  FileCache?: IFileCacheService;
  FileConverter?: IFileConverterService;
  FileParser?: IFileParserService;
  Resumable?: IResumableService;
  Store?: IStoreService;
};
