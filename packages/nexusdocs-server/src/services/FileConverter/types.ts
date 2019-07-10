import { ImageSharpConverter, ImageGMConverter, DocumentConverter } from './converters';
import { Readable } from 'stream';
import { KeyValueMap } from '../../types/common';
import { IFileContent } from '../../types/file';

export type ConverterClassType = typeof ImageSharpConverter | typeof ImageGMConverter | typeof DocumentConverter;

export type TConvertingCommand = string | number;

export interface IFileConverter<TConfig = any> {
  config: TConfig;
  input: IFileContent;
  output: IFileContent;
  commands: IConvertingCommands;
  options: IConvertingOptions;
  prepare(command: string, options: TConvertingCommand): void;
  exec(): Promise<Readable>;
}

export interface IFileConverterStatic {
  new (input: IFileContent, commands: IConvertingCommands, options: IConvertingOptions): IFileConverter;
  readonly inputFormats: string[];
  readonly outputFormats: string[];
  readonly formatMap?: KeyValueMap<string>;
  readonly needBuffer?: boolean;
  readonly needFile?: boolean;
  readonly selfCache?: boolean;
}

export type IConvertingCommands = KeyValueMap<TConvertingCommand>;

export type TConvertingOptionPair = [string, TConvertingCommand];

export interface IConvertingOptions {
  key?: string;
}

export interface IFileConverterService {
  convert(input: IFileContent, commands: string | IConvertingCommands, options?: IConvertingOptions): Promise<IFileContent>;
}
