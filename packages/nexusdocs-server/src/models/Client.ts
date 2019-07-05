import * as util from 'util';
import * as crypto from 'crypto';
import base32Encode = require('base32-encode');

import BaseModel from '../models/BaseModel';
import request = require('request');
import { IBaseData } from './types';

const randomBytes = util.promisify(crypto.randomBytes);

export type ClientRole = 'user' | 'admin';

export interface ClientData extends IBaseData {
  name: string;
  role: ClientRole;
  description?: string;
  clientKey: string;
  clientSecret: string;
}

class Client extends BaseModel<Client, ClientData> {

  static collectionName = 'clients';
  static schema = {
    name: { type: 'string' },
    role: { type: 'string', pattern: /^user|admin$/ },
    description: { type: 'string', optional: true },
    clientKey: { type: 'string', optional: true },
    clientSecret: { type: 'string', optional: true },
  };
  static defaultQueryOptions = {
    projection: {
      clientSecret: 0,
    }
  }

  async generateClientKey() {
    const buffer = await randomBytes(18);
    return base32Encode(<ArrayBuffer>buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), 'Crockford');
  }

  async generateClientSecret() {
    return (await randomBytes(36)).toString('base64');
  }
  
  async beforeCreate(data: Partial<ClientData>) {
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

  createUrl(options: any = {}) {
    if (!this._active) {
      throw new Error('could not create url from non-active instance');
    }
    const { clientKey, clientSecret } = this;
    const { hostname: _hostname, port: _port } = this.app.options.restful;
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

interface Client extends ClientData {}

export default Client;
