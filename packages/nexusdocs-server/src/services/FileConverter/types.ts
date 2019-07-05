import { ImageSharpConverter, ImageGMConverter, DocumentConverter } from './converters';
import { Readable } from 'stream';
import { KeyValueMap } from '../../types/common';

export type ConverterClassType = typeof ImageSharpConverter | typeof ImageGMConverter | typeof DocumentConverter;

export type TConvertingOption = string | number;

export interface IFileConverter {
  prepare(command: string, options: TConvertingOption): void;
}

export interface IFileContent {
  contentType: string;
  stream: Readable;
}

export type IConvertingOptions = KeyValueMap<TConvertingOption>;

export type TConvertingOptionPair = [string, TConvertingOption];

export interface IFileConverterService {
  convert(inputStream: Readable, filename: string, commands: string | IConvertingOptions): Promise<IFileContent>;
}
