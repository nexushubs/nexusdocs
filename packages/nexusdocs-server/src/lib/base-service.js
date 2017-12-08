import EventEmitter from 'events';

import { db } from '~/init/database';
import { ValidationError } from '~/lib/errors';
import { buildValidator } from '~/lib/validator';

export default class BaseService extends EventEmitter {
  
  constructor(name) {
    super();
    this.name = name;
  }

  init() {
    return Promise.resolve();
  }

  stop() {
    if (this._stop) {
      return this._stop();
    } else {
      return true;
    }
  }
  
}
