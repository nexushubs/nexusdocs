import { MongoClient } from 'mongodb';

import { db } from 'init/database';
import BaseProvider from '../../base-provider';

export default class GridFSProvider extends BaseProvider {

  static validOptions(options) {
    const { params } = options;
    if (!params || !params.database) {
      throw new TypeError('invalid options');
    }
  }

  constructor(options) {
    super(options);
  }

  async init() {
    const { params } = this.options;
    this.db = await MongoClient.connect(params.database);
  }

  destroy() {
    return this.db.close();
  }

}
