import _ from 'lodash';
import qs from 'qs';
import hmacSHA1 from 'crypto-js/hmac-sha1';
import Base64 from 'crypto-js/enc-base64';

import {
  urlSafeBase64Encode,
  sortedJSONStringify,
  sortObjectKey,
  promisifyStream,
  getTimestamp,
  addUrlParams,
} from './util';

export default class Signer {

  constructor(options) {
    this.options = options;
  }

  getToken(str) {
    const { clientKey, clientSecret } = this.options;
    const signature = hmacSHA1(str, clientSecret);
    const encodedSignature = urlSafeBase64Encode(Base64.stringify(signature));
    return `${clientKey}:${encodedSignature}`;
  }

  getSecuredUrl(url, signatureBody) {
    const signatureStr = sortedJSONStringify(signatureBody);
    return addUrlParams(url, {
      token: this.getToken(signatureStr),
    });
  }

  getAuthorizationHeader(signature, expires) {
    const data = {
      ...signature,
      expires,
    };
    const str = sortedJSONStringify(data);
    const token = this.getToken(str);
    return `NDS expires="${expires}",token="${token}"`;
  }

  getFullUrl(requestOptions) {
    let { url, baseUrl, qs } = requestOptions;
    if (/^https?/.test(url)) {
      return url;
    }
    url = `{baseUrl}{url}`;
    const separator = /\?/.test(url) ? '&' : '?';
    if (!_.isEmpty(options.qs)) {
      url += separator + qs.stringify(options.qs);
    }
  }

  /**
   * Sign a URL for secured request
   * @param {RequestOptions} requestOptions
   */
  signUrl(requestOptions) {
    let { method, url, expires } = requestOptions;
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
    requestOptions.url = url;
    // console.log('Signer.signUrl() => ', url);
    return url;
  }

  /**
   * Sign a request with body
   * @param {ReqestOptions} requestOptions 
   */
  signRequest(requestOptions) {
    let { method, url, expires, signature = {}, json, body } = requestOptions;
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
    _.merge(requestOptions, {
      headers: {
        Authorization: this.getAuthorizationHeader(signature, expires),
      },
    });
    // console.log('Signer.signRequest() => ', requestOptions);
    return requestOptions;
  }

}
