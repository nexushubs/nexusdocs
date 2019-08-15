import * as _ from 'lodash';
import * as qs from 'qs';
import hmacSHA1 = require('crypto-js/hmac-sha1');
import Base64 = require('crypto-js/enc-base64');

import {
  urlSafeBase64Encode,
  sortedJSONStringify,
  getTimestamp,
  addUrlParams,
} from './util';
import { ServerOptions, RequestOptions } from './types';

/**
 * Class for signing request
 */
export default class Signer {

  public options: ServerOptions;

  constructor(options: ServerOptions) {
    this.options = options;
  }

  getToken(str: string) {
    const { clientKey, clientSecret } = this.options;
    const signature = hmacSHA1(str, clientSecret);
    const encodedSignature = urlSafeBase64Encode(Base64.stringify(signature));
    return `${clientKey}.${encodedSignature}`;
  }

  getSecuredUrl(url: string, signatureBody: any) {
    const signatureStr = sortedJSONStringify(signatureBody);
    return addUrlParams(url, {
      token: this.getToken(signatureStr),
    });
  }

  getAuthorizationHeader(signature: any, expires: number) {
    const data = {
      ...signature,
      expires,
    };
    const str = sortedJSONStringify(data);
    const token = this.getToken(str);
    return `NDS expires="${expires}",token="${token}"`;
  }

  /**
   * Sign a URL for secured request
   */
  signUrl(options: RequestOptions) {
    let { method, url, expires } = options;
    if (!expires) {
      expires = this.options.defaultUrlExpires;
    }
    url = addUrlParams(url, {
      e: getTimestamp(expires),
    });
    const signatureBody = {
      method,
      url,
    };
    url = this.getSecuredUrl(url, signatureBody);
    options.url = url;
    return url;
  }

  /**
   * Sign a request with body
   */
  signRequest(options: RequestOptions) {
    let { method, url, expires, signature = {}, json, body } = options;
    if (!expires) {
      expires = this.options.defaultRequestExpires;
    }
    expires = getTimestamp(expires);
    signature = {
      ...signature,
      method,
      url,
      expires,
    };
    if (json) {
      signature.body = sortedJSONStringify(body);
    }
    _.merge(options, {
      headers: {
        Authorization: this.getAuthorizationHeader(signature, expires),
      },
    });
    return options;
  }

}
