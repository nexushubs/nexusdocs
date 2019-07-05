import * as _ from 'lodash';
import * as crypto from 'crypto';
import { Request, Response } from 'express'
import { wrap } from 'async-middleware';

import { ApiError } from '../../lib/errors';
import { urlSafeBase64Encode, sortedJSONStringify } from '../../lib/util';
import Base from '../../lib/Base';

export enum AuthFrom {
  Auto = 'auto',
  Url = 'url',
  Header = 'header',
}

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export interface ClientToken {
  expires: number;
  token: string;
}

export interface ClientCredentials {
  clientKey: string;
  clientSecret: string;
}

export type NeedAuthChecker = (auth: Authorization) => boolean

export interface AuthOptions {
  from?: AuthFrom;
  signature?: any;
  fields?: string[];
  role?: UserRole;
  needAuth?: NeedAuthChecker;
}

export class Authorization extends Base {

  public req: Request;
  public res: Response;
  public opt: AuthOptions;
  public error: any;
  public expires: number;
  public token: string;
  public client: ClientCredentials;

  constructor(req: Request, res: Response, options: NeedAuthChecker | AuthOptions) {
    super();
    this.req = req;
    this.res = res;
    if (_.isFunction(options)) {
      options = {
        needAuth: options,
      };
    }
    this.opt = _.merge({
      from: this.getDefaultFrom(req.method),
      signature: {},
      fields: [],
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
    let parsed = this.parseClientToken();
    if (!parsed) {
      return 'token not found';
    }
    const { expires, token } = parsed;
    if (!token) {
      return 'token not found';
    }
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

  parseClientToken(): ClientToken {
    const { from } = this.opt;
    if (from === AuthFrom.Auto) {
      return this.parseFromUrl() || this.parseFromHeader();
    } else if (from === AuthFrom.Header) {
      return this.parseFromHeader();
    } else {
      return this.parseFromUrl();
    }
  }

  getServerToken(expires) {
    let { req, res, opt: { from, signature, fields } } = this;
    const url = res.locals.fullUrl.replace(/&token=.+$/, '');
    const jsonType = 'application/json';
    signature = {
      ...signature,
      url,
      method: req.method,
    };
    if (from === 'header') {
      signature.expires = expires;
      if (fields) {
        signature = {
          ...signature,
          ..._.pick(req.body, fields),
        };
      }
    }
    if (req.is(jsonType) === jsonType) {
      signature.body = sortedJSONStringify(req.body);
    }
    const signatureStr = sortedJSONStringify(signature);
    return this.hashToken(signatureStr);
  }

  getClient(clientKey: string) {
    const { Client } = this.models;
    return Client.collection.findOne({ clientKey });
  }

  parseToken(token) {
    const pattern = /^(\w+)\.(.+)$/;
    const result = pattern.exec(token);
    if (!result) {
      return null;
    }
    const [undefined, clientKey, hash] = result;
    return { token, clientKey, hash };
  }

  parseFromHeader(): ClientToken {
    const tokenHeader = this.req.get('Authorization');
    const pattern = /^NDS expires="([^"]+)",token="([^"]+)"$/;
    const result = pattern.exec(tokenHeader);
    if (!result) {
      return null;
    }
    this.opt.from = AuthFrom.Header;
    return {
      expires: parseInt(result[1]),
      token: result[2],
    };
  }

  parseFromUrl(): ClientToken {
    const { query } = this.req;
    if (!query.e && !query.token) {
      return null;
    }
    this.opt.from = AuthFrom.Url;
    return {
      expires: parseInt(query.e),
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

export default function(options: AuthOptions = null) {
  return wrap(async(req: Request, res: Response, next) => {
    const auth = new Authorization(req, res, options);
    const authorized = await auth.authorize();
    if (!authorized) {
      throw new ApiError(401);
    }
    next();
  })
}
