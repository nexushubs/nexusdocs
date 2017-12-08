import _ from 'lodash';
import crypto from 'crypto';
import wrap from 'express-wrap-async';
import { URL, URLSearchParams } from 'url';

import { ApiError } from '~/lib/errors';
import { urlSafeBase64Encode, sortedJSONStringify } from '~/lib/util';

class Authorization {

  constructor(req, options = {}) {
    this.req = req;
    this.opt = _.defaults(options, {
      from: 'header',
      signature: {},
    });
  }

  async authorize() {
    const error = await this._authorize();
    if (error) {
      throw new ApiError(401, null, error);
    }
    return !this.error;
  }

  async _authorize() {
    const expires = parseInt(this.req.query.e);
    if (!expires || Date.now() / 1000 > expires) {
      return 'token expired';
    }
    const userToken = this.getUserToken();
    if (!userToken) {
      return 'token not found';
    }
    const result = this.parseToken(userToken);
    if (!result) {
      return 'invalid token';
    }
    const { clientKey, hash } = result;
    const client = await this.getClient(clientKey);
    if (!client) {
      return 'invalid token';
    }
    this.client = client;
    const serverToken = this.getServerToken();
    if (userToken !== serverToken) {
      return 'invalid token';
    }
    return null;
  }

  getUserToken() {
    if (this.opt.from === 'header') {
      return this.getTokenFromHeader();
    } else {
      return this.getTokenFromQuery();
    }
  }

  getServerToken() {
    const { req, opt: { from, signature } } = this;
    let str;
    if (from === 'header') {
      str = sortedJSONStringify(signature);
    } else if (from === 'url') {
      str = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      str = str.replace(/&token=.+$/, '');
      const url = new URL(str);
      const { searchParams } = url;
      _.each(signature, (value, key) => {
        searchParams.append(key, value);
      })
      searchParams.sort();
      str = url.toString();
      console.log(str);
    }
    return this.hashToken(str);
  }

  getClient(clientKey) {
    const { client } = this.req.model();
    return client.collection.findOne({ clientKey });
  }

  parseToken(token) {
    const pattern = /^(\w+):(.+)$/;
    const result = pattern.exec(token);
    if (!result) {
      return null;
    }
    const [undefined, clientKey, hash] = result;
    return {token, clientKey, hash};
  }

  getTokenFromHeader() {
    const tokenHeader = this.req.get('Authorization');
    const pattern = /^NDS (.+)$/;
    const result = pattern.exec(tokenHeader);
    if (result) {
      return result[1];
    }
    return null;
  }

  getTokenFromQuery() {
    return this.req.query.token || null;
  }

  hashToken(str) {
    const { clientKey, clientSecret } = this.client;
    const signature = crypto.createHmac('sha1', clientSecret).update(str).digest('base64');
    const encodedSignature = urlSafeBase64Encode(signature);
    return `${clientKey}:${encodedSignature}`;
  }

}

export default function(options) {
  return wrap(async(req, res, next) => {
    const auth = new Authorization(req, options);
    const authorized = await auth.authorize();
    console.log(auth.error);
    if (!authorized) {
      const err = new ApiError(401);
      next(err);
      return;
    }
    next();
  })
}
