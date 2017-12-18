import _ from 'lodash';
import path from 'path';
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
        const parser = new Parser(filename, stream, buffer);
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
