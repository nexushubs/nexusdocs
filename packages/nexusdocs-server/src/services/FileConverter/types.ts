import { ImageSharpConverter, ImageGMConverter, DocumentConverter } from './converters';
import { IBaseService } from '../../services/types';
import { Readable } from 'stream';

export type ConverterClassType = typeof ImageSharpConverter | typeof ImageGMConverter | typeof DocumentConverter;

export type TConvertingOption = string | number;

export interface IFileConverter {
  prepare(command: string, options: TConvertingOption): void;
}

export interface IFileContent {
  contentType: string;
  stream: Readable;
}

export interface IConvertingOptions {
  [key: string]: TConvertingOption;
}

export type TConvertingOptionPair = [string, TConvertingOption];

export interface IFileConverterService extends IBaseService {
  convert(inputStream: Readable, filename: string, commands: string | IConvertingOptions): Promise<IFileContent>;
}
