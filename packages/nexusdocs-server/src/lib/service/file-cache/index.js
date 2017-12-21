import _ from 'lodash';
import filenamify from 'filenamify';
import { PassThrough } from 'stream';

import BaseService from '~/lib/base-service';
import { ApiError } from '~/lib/errors';
import * as converterClasses from './converters';

export default class FileCache extends BaseService {

  streamCache = new Map();

  init(options) {
    this.
    this.initConverters();
  }

  has(key) {
    return this.driver.has(key);
  }

  get(key, streamBuilder) {
    const stream = new PassThrough;
    if (this.driver.has(key)) {
      const result = this.driver.get(key);
    }
  }

  /**
   * Set cache by stream
   * @param {string} key 
   * @param {stream.Readable} stream 
   * @param {object} options 
   * @param {expires} number - Life cycle 
   */
  set(key, stream, options) {

  }

}
