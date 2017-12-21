import _ from 'lodash';
import crypto from 'crypto';
import wrap from 'express-wrap-async';
import { URL, URLSearchParams } from 'url';

import { ApiError } from '~/lib/errors';
import { urlSafeBase64Encode, sortedJSONStringify } from '~/lib/util';

class Authorization {

  constructor(req, options = {}) {
    this.req = req;
    if (_.isFunction(options)) {
      options = {
        needAuth: options,
      };
    }
    if (!options.from) {
      options.from = this.getDefaultFrom(req.method);
    }
    this.opt = _.merge({
      from: 'url',
      signature: {},
      role: 'user',
      needAuth: () => true,
    }, options);
    
  }

  getDefaultFrom(method) {
    return ['GET', 'HEAD'].includes(method) ? 'url' : 'header';
  }

  async authorize() {
    const { req, opt: { needAuth } } = this;
    if (_.isFunction(needAuth) && !needAuth(this)) {
      return true;
    }
    const error = await this._authorize();
    if (error) {
      throw new ApiError(401, null, error);
    }
    return !this.error;
  }

  async _authorize() {
    let { expires, token } = this.parseClientToken();
    if (!token) {
      return 'token not found';
    }
    expires = parseInt(expires);
    if (!expires) {
      return 'expire time not provided';
    }
    if (Date.now() / 1000 > expires) {
      return 'token expired';
    }
    const result = this.parseToken(token);
    if (!result) {
      return 'invalid token: bad format';
    }
    const { clientKey, hash } = result;
    const client = await this.getClient(clientKey);
    if (!client) {
      return 'invalid client id';
    }
    this.client = client;
    const serverToken = this.getServerToken(expires);
    if (token !== serverToken) {
      return 'invalid token: mismatch';
    }
    this.expires = expires;
    this.token = token;
    return null;
  }

  parseClientToken() {
    const { from } = this.opt;
    if (from === 'header') {
      return this.parseFromHeader();
    } else {
      return this.parseFromUrl();
    }
  }

  getServerToken(expires) {
    let { req, opt: { from, signature } } = this;
    let url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    url = url.replace(/&token=.+$/, '');
    const jsonType = 'application/json';
    signature = {
      ...signature,
      url,
      method: req.method,
    };
    if (from === 'header') {
      signature.expires = expires;
    }
    if (req.is(jsonType) === jsonType) {
      signature.body = sortedJSONStringify(req.body);
    }
    const signatureStr = sortedJSONStringify(signature);
    return this.hashToken(signatureStr);
  }

  getClient(clientKey) {
    const { client } = this.req.model();
    return client.collection.findOne({ clientKey });
  }

  parseToken(token) {
    const pattern = /^(\w+)\.(.+)$/;
    const result = pattern.exec(token);
    if (!result) {
      return null;
    }
    const [undefined, clientKey, hash] = result;
    return {token, clientKey, hash};
  }

  parseFromHeader() {
    const tokenHeader = this.req.get('Authorization');
    const pattern = /^NDS expires="([^"]+)",token="([^"]+)"$/;
    const result = pattern.exec(tokenHeader);
    if (!result) {
      return {};
    }
    return {
      expires: result[1],
      token: result[2],
    };
  }

  parseFromUrl() {
    const { query } = this.req;
    return {
      expires: query.e,
      token: query.token,
    };
  }

  hashToken(str) {
    const { clientKey, clientSecret } = this.client;
    const signature = crypto.createHmac('sha1', clientSecret).update(str).digest('base64');
    const encodedSignature = urlSafeBase64Encode(signature);
    return `${clientKey}.${encodedSignature}`;
  }

}

export default function(options) {
  return wrap(async(req, res, next) => {
    const auth = new Authorization(req, options);
    const authorized = await auth.authorize();
    if (!authorized) {
      throw new ApiError(401);
    }
    next();
  })
}
