import { Readable } from 'stream';
import { KeyValueMap } from './common';

export type ReadStreamGetter = () => Promise<Readable>;

export interface IFileContent {
  stream?: Readable;
  getStream?: ReadStreamGetter;
  contentType?: string;
  contentLength?: number;
  filename?: string;
  format?: string;
  buffer?: Buffer;
  metadata?: KeyValueMap;
}
