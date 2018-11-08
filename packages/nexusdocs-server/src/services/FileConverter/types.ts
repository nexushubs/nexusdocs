import { ImageSharpConverter, ImageGMConverter, DocumentConverter } from './converters';
import { IBaseService } from '../../services/types';
import { Readable } from 'stream';

export type ConverterClassType = typeof ImageSharpConverter | typeof ImageGMConverter | typeof DocumentConverter;

export interface IFileConverter {
  prepare(command: string, options: string): void;
}

export interface IFileData {
  contentType: string;
  stream: Readable;
}

export interface IFileConverterService extends IBaseService {
  convert(inputStream: Readable, filename: string, commands: string): Promise<IFileData>;
}
