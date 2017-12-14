import _ from 'lodash';
import path from 'path';

import BaseService from '~/lib/base-service';
import * as parserClasses from './parsers';

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
    const ext = path.extname(filename);
    return this.parsers[ext] || [];
  }

  parse(filename, stream) {
    const parsers = this.getParserByFilename(filename);
    const promises = _.map(parsers, Parser => {
      const parser = new Parser(filename, stream);
      return parser.parse();
    });
    Promise.all(promises)
    .then(metadataList => {
      const metadata = _.assign({}, ...metadataList);
      console.log('metadata =', metadata);
      stream.emit('metadata', metadata);
    });
  }

}
