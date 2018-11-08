import EventEmitter from 'events';
import Base from 'lib/Base';
import { IBaseService } from './types';

export default class BaseService extends Base implements IBaseService {
  
  protected options: any;
  
  constructor(options) {
    super();
    this.options = options || {};
  }

  async init(options: any) {
  }

  async stop() {
  }

}
