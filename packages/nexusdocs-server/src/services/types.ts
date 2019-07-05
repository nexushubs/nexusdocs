import { IBase } from '../types';
import { IFileCacheService } from './FileCache/types';
import { IFileConverterService } from './FileConverter/types';
import { IFileParserService } from './FileParser/types';
import { IResumableService } from './Resumable/types';
import { IStoreService } from './Store/types';
import { IElasticsearchService } from './Elasticsearch/types';

export interface IServices {
  Elasticsearch?: IElasticsearchService;
  FileCache?: IFileCacheService;
  FileConverter?: IFileConverterService;
  FileParser?: IFileParserService;
  Resumable?: IResumableService;
  Store?: IStoreService;
};
