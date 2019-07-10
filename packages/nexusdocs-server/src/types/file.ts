import { Readable } from 'stream';

export type ReadStreamGetter = () => Promise<Readable>;

export interface IFileContent {
  stream?: Readable;
  getStream?: ReadStreamGetter;
  contentType?: string;
  filename?: string;
  format?: string;
  buffer?: Buffer;
}
