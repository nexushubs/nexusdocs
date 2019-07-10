import * as services from '.';

export interface IServices {
  Elasticsearch?: services.Elasticsearch
  FileCache?: services.FileCache
  FileConverter?: services.FileConverter
  FileParser?: services.FileParser
  Resumable?: services.Resumable
  Store?: services.Store
};
