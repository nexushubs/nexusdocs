import { Readable, Writable } from 'stream';
import { IBaseService } from '../../services/types';

export type TIdentifier = string;

export interface ResumableParams {
  chunkNumber: number,
  chunkSize: number,
  totalSize: number,
  identifier: TIdentifier,
  filename: number,
  totalChunks: number,
  fileSize: number,
}

export enum ChunkStatus {
  Ok = 1,
  Pending = 0,
}

export interface IStatusCache {
  params: ResumableParams,
  addTime: number,
  updateTime: number,
  status: ChunkStatus[],
}

export interface IResumableCache {
  init(): Promise<void>
  getFilePath(identifier: TIdentifier, index: number): string;
  getFiles(identifier: TIdentifier): string[];
  checkStatus(params: ResumableParams): boolean;
  createWriteStream(params: ResumableParams): Writable;
  createReadStream(params: ResumableParams): Readable;
  cleanUp(identifier: TIdentifier);
}

export interface IResumableService extends IBaseService {
  createWriteStream(params: ResumableParams): Promise<Writable>;
  createReadStream(params: ResumableParams): Promise<Readable>;
  checkStatus(params: ResumableParams): boolean;
}
