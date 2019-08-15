import { KeyValueMap } from '../../types/common';
import { IFileContent } from '../../types/file';
import { FileContent } from '../../lib/FileContent';
import { BaseConfig } from '../types';

export type TConvertingCommand = string | number;

export interface BaseConverterConfig extends BaseConfig {
}

export interface IFileConverter<TConfig extends BaseConverterConfig = any> {
  config: TConfig;
  input: FileContent;
  output: FileContent;
  commands: IConvertingCommands;
  options: IConvertingOptions;
  prepare: (command: string, options: TConvertingCommand) => void;
  exec: () => Promise<void>;
  preCache?: () => Promise<void>;
}

export interface IFileConverterStatic<TConfig extends BaseConverterConfig = any> {
  new (input: FileContent, commands: IConvertingCommands, options: IConvertingOptions, config: TConfig): IFileConverter;
  readonly inputFormats: string[];
  readonly outputFormats: string[];
  readonly formatMap?: KeyValueMap<string>;
  readonly needBuffer?: boolean;
  readonly needFile?: boolean;
  readonly needPreCache?: boolean;
}

export type IConvertingCommands = KeyValueMap<TConvertingCommand>;

export type TConvertingOptionPair = [string, TConvertingCommand];

export interface IConvertingOptions {
  id?: string;
  key?: string;
}

export interface IFileConverterService {
  convert(input: IFileContent, commands: string | IConvertingCommands, options?: IConvertingOptions): Promise<IFileContent>;
}
