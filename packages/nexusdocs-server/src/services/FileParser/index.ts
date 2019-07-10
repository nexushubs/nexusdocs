import * as _ from 'lodash';
import * as path from 'path';
import * as config from 'config';
import { Readable } from 'stream';
import * as getStream from 'get-stream';

import { KeyValueMap } from '../../types/common';
import BaseService from '../BaseService';
import * as parserClasses from './parsers';
import { IFileParserStatic } from './types';
import { IFileContent } from '../../types/file';
import { FileContent } from '../../lib/FileContent';

const NEED_BUFFER_PROP = 'needBuffer';

export default class FileParser extends BaseService {

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

  async parse(input: IFileContent) {
    input = FileContent.from(input);
    const { filename, stream } = input;
    const parsers = this.getParserByFilename(filename);
    let bufferPromise = null;
    if (_.some(parsers, NEED_BUFFER_PROP)) {
      bufferPromise = getStream.buffer(stream);
    };
    const promises = _.map(parsers, async Parser => {
      let p = Promise.resolve();
      if (Parser[NEED_BUFFER_PROP]) {
        p = bufferPromise;
      }
      return p.then(buffer => {
        const options = this.getParserOptions(Parser.name);
        const parser = new Parser(input, options);
        if (parser.init) {
          parser.init(options);
        }
        return parser.parse();
      });
    });
    return Promise.all(promises)
      .then(dataList => {
        const metadata = {};
        _.each(dataList, (data, index) => {
          const { key } = parsers[index];
          metadata[key] = {
            ...metadata[key],
            ...data,
          };
        });
        stream.emit('metadata', metadata);
        return metadata;
      });
  }

}
