import Base from '../lib/Base';

class BaseService<TConfig = any> extends Base {
  
  protected options: TConfig;
  
  constructor(options: TConfig) {
    super();
    this.options = options;
  }

  async init(options: TConfig) {
  }

  async stop() {
  }

}

export default BaseService;
