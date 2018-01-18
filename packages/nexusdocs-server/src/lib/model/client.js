import BaseModel from '~/lib/base-model';
import util from 'util';
import crypto from 'crypto';
import base32Encode from 'base32-encode';
import config from 'config';

const randomBytes = util.promisify(crypto.randomBytes);

export default class Client extends BaseModel {

  collectionName = 'clients';
  schema = {
    name: { type: 'string' },
    role: { type: 'string', pattern: /^user|admin$/ },
    description: { type: 'string', optional: true },
    clientKey: { type: 'string', optional: true },
    clientSecret: { type: 'string', optional: true },
  };
  defaultProjection = {
    clientSecret: 0,
  }

  async generateClientKey() {
    return base32Encode(await randomBytes(18), 'Crockford');
  }

  async generateClientSecret() {
    return (await randomBytes(36)).toString('base64');
  }
  
  async beforeCreate(data) {
    data.clientKey = await this.generateClientKey();
    data.clientSecret = await this.generateClientSecret();
    return this.ensureUnique({ name: data.name })
  }
  
  async updateSecret() {
    console.log('updating secret');
    return this.update({
      clientSecret: await this.generateClientSecret(),
    });
  }

  async updateAuth() {
    return this.update({
      clientKey: await this.generateClientKey(),
      clientSecret: await this.generateClientSecret(),
    });
  }

  createUrl(options = {}) {
    if (!this._active) {
      throw new Error('could not create url from non-active instance');
    }
    const { clientKey, clientSecret } = this;
    const { hostname: _hostname, port: _port } = this.nds.options.restful;
    const {
      hostname = _hostname,
      port = _port,
      schema = 'http',
      entry = '/api',
    } = options;
    let portStr = `:${port}`;
    if ((schema === 'http' && port == 80) || (schema === 'https' && port == 443)) {
      portStr = '';
    }
    const entryStr = entry.replace(/^\//, '');
    return `${schema}://${clientKey}:${encodeURIComponent(clientSecret)}@${hostname}${portStr}/${entryStr}`;
  }
}
