import EventEmitter from 'events';

import { db } from '~/init/database';
import { ValidationError } from '~/lib/errors';
import { buildValidator } from '~/lib/validator';

export default class Base extends EventEmitter {
  
  constructor() {
    super();
  }

  init() {
    return Promise.resolve();
  }
  
}
