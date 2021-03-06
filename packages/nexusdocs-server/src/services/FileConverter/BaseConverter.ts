import { getExtension } from '../../lib/util';
import Base from '../../lib/Base';
import { IConvertingCommands, IConvertingOptions, IFileConverterStatic } from './types';
import { getCacheKey } from './utils';
import { KeyValueMap } from '../../types/common';
import { FileContent } from '../../lib/FileContent';

export default class BaseConverter<TConfig = any> extends Base {
  
  filePath = null;
  public extensions: string[] = [];
  public formatMap: KeyValueMap<string> = {};
  public needBuffer = false;
  public needFile = false;
  public config: TConfig;
  public input: FileContent;
  public output: FileContent;
  public commands: IConvertingCommands;
  public options: IConvertingOptions;
  
  constructor(input: FileContent, commands: IConvertingCommands, options: IConvertingOptions, config: TConfig) {
    super();
    this.input = input;
    this.commands = commands;
    let format = getExtension(input.filename);
    const { formatMap } = this;
    if (formatMap && formatMap[format]) {
      format = formatMap[format];
    }
    this.input.format = format;
    this.options = options;
    this.config = config;
    this.output = new FileContent({
      filename: input.filename,
    });
  }

  get _static() {
    return this.constructor as IFileConverterStatic;
  }

  getFormat() {
    return this.output.format;
  }

  getCacheKey() {
    const { commands, options: { key } } = this;
    return getCacheKey(key, commands);
  }

}
