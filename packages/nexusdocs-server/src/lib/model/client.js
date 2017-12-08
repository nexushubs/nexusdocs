import BaseModel from '~/lib/base-model';
import util from 'util';
import crypto from 'crypto';
import base32Encode from 'base32-encode';

const randomBytes = util.promisify(crypto.randomBytes);

export default class Client extends BaseModel {

  name = 'clients';
  schema = {
    clientKey: { type: 'string', optional: true },
    clientSecret: { type: 'string', optional: true },
    name: { type: 'string' },
    description: { type: 'string', optional: true },
    role: { type: 'string', pattern: /^user|admin$/ },
  };
  defaultProjection = {
    clientSecret: 0,
  }
  
  async beforeCreate(data) {
    data.clientKey = base32Encode(await randomBytes(18), 'Crockford');
    data.clientSecret = (await randomBytes(36)).toString('base64');
    return this.ensureUnique({ name: data.name })
  }
}
