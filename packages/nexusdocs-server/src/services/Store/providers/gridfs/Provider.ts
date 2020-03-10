import { MongoClient, Db } from 'mongodb';

import BaseProvider from '../../BaseProvider';

export default class GridFSProvider extends BaseProvider {

  public _client: MongoClient;
  public _db: Db;

  validOptions(options: any) {
    const { params } = options;
    if (!params || !params.database) {
      throw new TypeError('invalid options');
    }
  }

  async init() {
    const { params } = this.options;
    this._db = this.dbClient.db(params.database);
  }

  destroy() {
    return this._client.close();
  }

}
