import _ from 'lodash';
import request from 'request';
import qs from 'qs';
import parse from 'url-parse';

import {
  urlSafeBase64Encode,
  sortedJSONStringify,
  JSONParse,
} from './util';
import { ApiError } from './errors'
import Signer from './signer';
import Namespace from './namespace';

/**
 * Class presenting NexusDocs client instance
 * @typicalname client
 */
class Client {

  /**
   * Creates an instance of NDS Client.
   * @example
   * You can pass a URL sting instead of a config object:
   * ```xml
   * http://<clientKey>:<clientSecret>@<hostname>:<port><endPoint>
   * ```
   * @param {ServerOptions|string} options - Server options, see [ServerOptions](#Client..ServerOptions)
   */
  constructor(options = {}) {
    this.defaultOptions = {
      hostname: '127.0.0.1',
      secure: false,
      port: 4000,
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
      options.secure = protocol === 'https:';
      options.port = port ? parseInt(port) : (options.secure ? 443 : 80);
      options.endPoint = pathname
      options.clientKey = username;
      options.clientSecret = decodeURIComponent(password);
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

  buildUrl(options) {
    let { url } = options;
    if (/^https?/.test(url)) {
      return url;
    }
    let signatureUrl = url;
    if (!_.isEmpty(options.qs)) {
      url += '?' + qs.stringify(options.qs);
    }
    options.url = this.getFullUrl(url);
  }

  getUrl(options) {
    this.buildUrl(options);
    this.signer.signUrl(options);
    return options.url;
  }

  /**
   * @protected
   * @ignore
   * @param {RequestOptions} options 
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
   * @param {RequestOptions} options 
   * @returns {WritableStream}
   */
  requestAsStream(options) {
    this.buildUrl(options);
    this.signer.signRequest(options);
    return request(options);
  }

  /**
   * Request NDS and return a Promise
   * @protected
   * @ignore
   * @param {RequestOptions} options - See [Namespace~RequestOptions](#Namespace..RequestOptions)
   * @returns {Promise}
   * @fulfil {object} - NDS response object
   * @reject {object} - NDS error object
   * 
   * - `error.status`: Status code
   * - `error.error`: The error message
   * - `error.description`: The error description
   */
  request(options) {
    this.buildUrl(options);
    this.signer.signRequest(options);
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error);
          return;
        }
        let errorMessage;
        const contentType = response.headers['content-type'];
        if (contentType.indexOf('application/json') !== 0) {
          errorMessage = `Invalid Response`;
        } else if (!_.isObject(body)) {
          const jsonErrorMessage = 'Invalid JSON format';
          try {
            body = JSONParse(body);
          } catch (error) {
            errorMessage = jsonErrorMessage;
          } finally {
            if (!_.isObject(body)) {
              errorMessage = jsonErrorMessage;
            }
          }
        }
        if (response.statusCode >= 400 || errorMessage) {
          if (_.isObject(body)) {
            if (body.message) {
              errorMessage = body.message;
            }
            if (body.errors) {
              body = body.errors;
            }
          }
          error = new ApiError(response.statusCode, errorMessage, body);
        }
        if (error) {
          reject(error);
        } else {
          resolve(body);
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
