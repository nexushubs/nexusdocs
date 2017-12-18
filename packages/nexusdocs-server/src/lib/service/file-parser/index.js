import _ from 'lodash';
import path from 'path';
import config from 'config';
import getStream from 'get-stream';

import BaseService from '~/lib/base-service';
import * as parserClasses from './parsers';

const NEED_BUFFER_PROP = 'needBuffer';

export default class FileParser extends BaseService {

  init(options) {
    this.initParsers();
  }

  initParsers() {
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
        this.parsers[ext].push(Parser);
      });
    });
  }

  getParserByFilename(filename) {
    const ext = path.extname(filename).slice(1);
    return this.parsers[ext] || [];
  }

  getParserOptions(name) {
    const key = `services.FileParser.parsers.${name}`;
    let options;
    try {
      options = config.get(key);
    } catch(error) {
      options = {};
    }
    return options;
  }

  parse(filename, stream) {
    const parsers = this.getParserByFilename(filename);
    let bufferPromise = null;
    if (_.some(parsers, NEED_BUFFER_PROP)) {
      bufferPromise = getStream.buffer(stream);
    };
    const promises = _.map(parsers, Parser => {
      let p = Promise.resolve();
      if (Parser[NEED_BUFFER_PROP]) {
        p = bufferPromise;
      }
      return p.then(buffer => {
        const options = this.getParserOptions(Parser.name);
        const parser = new Parser(filename, stream, buffer, options);
        if (parser.init) {
          parser.init(options);
        }
        return parser.parse();
      });
    });
    return Promise.all(promises)
    .then(dataList => {
      console.log(dataList);
      const metadata = {};
      _.each(dataList, (data, index) => {
        const { key } = parsers[index];
        metadata[key] = {
          ...metadata[key],
          ...data,
        };
      });
      console.log('metadata =', metadata);
      stream.emit('metadata', metadata);
      return metadata;
    });
  }

}
