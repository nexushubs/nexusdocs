import _ from 'lodash';
import Namespace from 'namespace';
import request from 'request';
import qs from 'qs';
import parse from 'url-parse';
import hmacSHA1 from 'crypto-js/hmac-sha1';
import Base64 from 'crypto-js/enc-base64';
import stringify from 'json-stable-stringify';

import { urlSafeBase64Encode, sortedJSONStringify, sortObjectKey } from './util';


/**
 * Class presenting NexusDocs client instance
 * @typicalname nds
 * @property {object} options - Server config
 */
class Client {

  /**
   * Creates an instance of NDS Client.
   * @example
   * You can pass a URL sting instead of a config object:
   * ```xml
   * http://<clientKey>:<clientSecret>@<hostname>:<port><endPoint>
   * ```
   * @param {object|string} options - Server config object or a connection URL
   * @param {string} [options.hostname=127.0.0.1] - hostname
   * @param {boolean} [options.secure=false] - Whether to use HTTPS
   * @param {number} [options.port=4000] - Server Port
   * @param {string} [options.endPoint=/api] - API endpoint
   * @param {string} options.clientKey - NDS API key
   * @param {string} options.clientSecret - NDS API secret
   * @param {number} options.defaultExpires - default expires time
   */
  constructor(options = {}) {
    this.defaultOptions = {
      hostname: '127.0.0.1',
      secure: false,
      port: '4000',
      endPoint: '/api',
      clientKey: '',
      clientSecret: '',
      defaultExpires: 3600,
    };
    if (_.isString(options)) {
      const parsed = parse(options, true);
      options = {};
      const { hostname, protocol, port, pathname, username, password, query } = parsed;
      options.hostname = hostname,
      options.secure = protocol === 'https';
      options.port = port ? parseInt(port) : 80;
      options.endPoint = pathname
      options.clientKey = username;
      options.clientSecret = password;
      if (query.defaultExpires) {
        options.defaultExpires = query.defaultExpires
      }
    }
    this.options = _.defaults(options, this.defaultOptions);
  }

  getToken(str) {
    const { clientKey, clientSecret } = this.options;
    const signature = hmacSHA1(str, clientSecret);
    const encodedSignature = urlSafeBase64Encode(Base64.stringify(signature));
    return `${clientKey}:${encodedSignature}`;
  }

  getSecuredUrl(url, signatureStr) {
    const token = this.getToken(signatureStr);
    const separator = /\?/.test(url) ? '&' : '?'
    return `${url}${separator}token=${token}`;
  }

  getSecuredHeader(data) {
    const str = sortedJSONStringify(data);
    const token = this.getToken(str);
    return `NDS ${token}`;
  }

  getFullUrl(url) {
    const { secure, port } = this.options;
    const schema = secure ? 'https' : 'http';
    let portStr;
    if ((secure && port == 443) || (!secure && port == 80)) {
      portStr = '';
    } else {
      portStr = `:${port}`;
    }
    return `${schema}://${this.options.hostname}${portStr}${this.options.endPoint}${url}`;
  }

  /**
   * Build full URL of a NDS request
   * @protected
   * @ignore
   * @param {string} url 
   * @param {object} [options] 
   * @param {object} [options.qs] - Query string parameters
   * @param {object} [options.signature] - Secure params
   * @returns {string}
   */
  buildUrl(url, options = {}) {
    if (/^https?/.test(url)) {
      return url;
    }
    let signatureUrl = url;
    if (!_.isEmpty(options.qs)) {
      url += '?' + qs.stringify(options.qs);
    }
    url = this.getFullUrl(url);
    if (options.signature) {
      signatureUrl = this.getFullUrl(signatureUrl);
      let query = { ...options.qs, ...options.signature };
      query = sortObjectKey(query);
      signatureUrl += '?' + qs.stringify(query);
      console.log('url =', url);
      console.log('signatureUrl =', signatureUrl);
      url = this.getSecuredUrl(url, signatureUrl);
    }
    return url;
  }

  /**
   * @protected
   * @ignore
   * @param {object} options 
   */
  processHeader(options) {
    if (options.signature) {
      options.headers = options.headers || {}
      options.headers.Authorization = this.getSecuredHeader(options.signature),
      delete options.signature;
    }
  }

  /**
   * Request NDS server and return a stream like object
   * @protected
   * @ignore
   * @param {string} method 
   * @param {string} url 
   * @param {object} [options]
   * @returns {WritableStream}
   */
  requestAsStream(method, url, options = {}) {
    this.processHeader(options);
    options = {
      method,
      url: this.buildUrl(url, options),
      ...options,
    };
    return request(options);
  }

  /**
   * Request NDS and return a Promise
   * @protected
   * @ignore
   * @param {string} method 
   * @param {string} url 
   * @param {object} [options] 
   * @returns {Promise}
   * @fulfil {object} - NDS response object
   * @reject {object} - NDS error object
   * 
   * - `error.status`: Status code
   * - `error.error`: The error message
   * - `error.description`: The error description
   */
  request(method, url, options) {
    this.processHeader(options);
    options = {
      method,
      url: this.buildUrl(url, options),
      ...options,
    };
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        const contentType = response.headers['content-type'];
        if (!/^application\/json/i.test(contentType)) {
          reject('invalid response');
          return;
        }
        if (error) {
          reject(error);
          return;
        }
        let result;
        try {
          result = JSON.parse(body);
        } catch (error) {
          reject(new TypeError('invalid json format'));
        }
        if (response.statusCode != 200) {
          reject(result);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Get namespace instance
   * @param {string} name - The name
   * @param {object} [options] - Additional options
   * @returns {Namespace} Namespace instance
   */
  getNamespace(name, options) {
    return new Namespace(this, name, options);
  }

}

export default Client;
