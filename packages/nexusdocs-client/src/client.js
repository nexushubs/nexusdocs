import _ from 'lodash';
import Namespace from 'namespace';
import request from 'request';
import qs from 'qs';
import parse from 'url-parse';

import {
  urlSafeBase64Encode,
  sortedJSONStringify,
  sortObjectKey,
  promisifyStream,
  getTimestamp,
} from './util';
import Signer from './signer';

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
   * @param {number} options.defaultUrlExpires - default expires time
   */
  constructor(options = {}) {
    this.defaultOptions = {
      hostname: '127.0.0.1',
      secure: false,
      port: '4000',
      endPoint: '/api',
      clientKey: '',
      clientSecret: '',
      defaultUrlExpires: 3600,
      defaultRequestExpires: 60,
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
      if (query.defaultUrlExpires) {
        options.defaultUrlExpires = query.defaultUrlExpires
      }
    }
    this.options = _.defaults(options, this.defaultOptions);
    this.signer = new Signer(options);
  }

  getFullUrl(url) {
    const { secure, port } = this.options;
    const schema = secure ? 'https' : 'http';
    if (!url) {
      url = '';
    }
    let portStr;
    if ((secure && port == 443) || (!secure && port == 80)) {
      portStr = '';
    } else {
      portStr = `:${port}`;
    }
    return `${schema}://${this.options.hostname}${portStr}${this.options.endPoint}${url}`;
  }

  buildUrl(requestOptions) {
    let { url } = requestOptions;
    if (/^https?/.test(url)) {
      return url;
    }
    let signatureUrl = url;
    if (!_.isEmpty(requestOptions.qs)) {
      url += '?' + qs.stringify(requestOptions.qs);
    }
    requestOptions.url = this.getFullUrl(url);
  }

  getUrl(requestOptions) {
    this.buildUrl(requestOptions);
    return this.signer.signUrl(requestOptions);
  }

  /**
   * @protected
   * @ignore
   * @param {object} options 
   */
  processHeader(options) {
    const { signature, expires } = options;
    if (signature && options.expires) {
      options.headers = options.headers || {}
      options.headers.Authorization = this.getAuthorizationHeader(signature, expires),
      delete options.signature;
      delete options.expires;
    }
  }

  /**
   * Request NDS server and return a stream like object
   * @protected
   * @ignore
   * @param {RequestOptions} requestOptions 
   * @returns {WritableStream}
   */
  requestAsStream(requestOptions) {
    this.buildUrl(requestOptions);
    this.signer.signRequest(requestOptions);
    return request(requestOptions);
  }

  /**
   * Request NDS and return a Promise
   * @protected
   * @ignore
   * @param {RequestOptions} requestOptions 
   * @returns {Promise}
   * @fulfil {object} - NDS response object
   * @reject {object} - NDS error object
   * 
   * - `error.status`: Status code
   * - `error.error`: The error message
   * - `error.description`: The error description
   */
  request(requestOptions) {
    this.buildUrl(requestOptions);
    this.signer.signRequest(requestOptions);
    console.log({requestOptions});
    return new Promise((resolve, reject) => {
      request(requestOptions, (error, response, body) => {
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
