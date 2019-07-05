import * as _ from 'lodash';
import * as request from 'request';
import * as qs from 'qs';
import * as parse from 'url-parse';

import {
  JSONParse,
} from './util';
import { ApiError } from './errors'
import Signer from './signer';
import Namespace from './namespace';
import { RequestOptions, ServerOptions, NamespaceOptions } from './types';

/**
 * Class presenting NexusDocs client instance
 */
class Client {

  public options: ServerOptions;
  public defaultOptions: ServerOptions;
  public signer: Signer;

  /**
   * Creates an instance of NDS Client.
   * @example
   * You can pass a URL sting instead of a config object:
   * ```xml
   * http://<clientKey>:<clientSecret>@<hostname>:<port><endPoint>
   * ```
   * @param options - Server options
   */
  constructor(options: ServerOptions = {}) {
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
        options.defaultUrlExpires = parseInt(query.defaultUrlExpires);
      }
    }
    this.options = _.defaults(options, this.defaultOptions);
    this.signer = new Signer(options);
  }

  getFullUrl(url: string) {
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

  buildUrl(options: RequestOptions) {
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

  getUrl(options: RequestOptions) {
    this.buildUrl(options);
    this.signer.signUrl(options);
    return options.url;
  }

  /**
   * Request NDS server and return a stream like object
   * @protected
   * @param options 
   */
  requestAsStream(options: RequestOptions) {
    this.buildUrl(options);
    this.signer.signRequest(options);
    return request(options as any);
  }

  /**
   * Request NDS and return a Promise
   * @protected
   * @ignore
   * @param options - See [Namespace~RequestOptions](#Namespace..RequestOptions)
   * @returns Promise of request result
   */
  request(options: RequestOptions) {
    this.buildUrl(options);
    this.signer.signRequest(options);
    return new Promise((resolve, reject) => {
      request(options as any, (error, response, body) => {
        if (error) {
          reject(error);
          return;
        }
        let errorMessage: string;
        const contentType = response.headers['content-type'];
        if (!contentType || contentType.indexOf('application/json') !== 0) {
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
          if (_.isPlainObject(body)) {
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
   * @param name - The name
   * @param options - Additional options
   * @returns Namespace instance
   */
  getNamespace(name: string, options: NamespaceOptions) {
    return new Namespace(this, name, options);
  }

}

export default Client;
