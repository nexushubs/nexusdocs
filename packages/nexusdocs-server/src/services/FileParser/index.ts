import * as _ from 'lodash';
import * as path from 'path';
import * as config from 'config';

import { KeyValueMap } from '../../types/common';
import BaseService from '../BaseService';
import * as parserClasses from './parsers';
import { IFileParserStatic, IFileParserService, FileMetaData } from './types';
import { IFileContent } from '../../types/file';
import { FileContent } from '../../lib/FileContent';

const NEED_BUFFER_PROP = 'needBuffer';

export default class FileParser extends BaseService implements IFileParserService {

  private parsers: KeyValueMap<IFileParserStatic[]>;

  async init() {
    this.initParsers();
  }

  private initParsers() {
    this.parsers = {};
    _.each(parserClasses, Parser => {
      const options = this.getParserOptions(Parser.name);
      if (options.disabled) {
        return;
      }
      _.each(Parser.extensions, ext => {
        if (!this.parsers[ext]) {
          this.parsers[ext] = [];
        }
        this.parsers[ext].push(Parser as any as IFileParserStatic);
      });
    });
  }

  private getParserByFilename(filename: string) {
    const ext = path.extname(filename).slice(1);
    return this.parsers[ext] || [];
  }

  private getParserOptions(name: string) {
    const key = `services.FileParser.parsers.${name}`;
    let options;
    try {
      options = config.get(key);
    } catch(error) {
      options = {};
    }
    return options;
  }

  async parse(_input: IFileContent) {
    const input = FileContent.from(_input);
    const { filename, stream } = input;
    const parsers = this.getParserByFilename(filename);
    if (_.some(parsers, NEED_BUFFER_PROP)) {
      await input.readToBuffer();
    };
    const metadata: FileMetaData = {};
    for (const Parser of parsers) {
      const options = this.getParserOptions(Parser.name);
      const parser = new Parser(input, options);
      if (parser.init) {
        parser.init(options);
      }
      const result = await parser.parse();
      const { key } = Parser;
      metadata[key] = { ...metadata[key], ...result };
    }
    stream.emit('metadata', metadata);
    return metadata;
  }

}
