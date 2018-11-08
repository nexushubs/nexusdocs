import { MongoClient, Db } from 'mongodb';

import BaseProvider from '../../BaseProvider';

export default class GridFSProvider extends BaseProvider {

  public _client: MongoClient;
  public _db: Db;

  validOptions(options) {
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
    this._client = await MongoClient.connect(params.database, { useNewUrlParser: true });
    this._db = this._client.db();
  }

  destroy() {
    return this._client.close();
  }

}
