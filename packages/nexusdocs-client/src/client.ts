import * as _ from 'lodash';
import * as qs from 'qs';
import * as parse from 'url-parse';
import fetch, { Response, Headers } from 'node-fetch';
import * as contentTypeParser from 'content-type';
import * as contentDispositionParser from 'content-disposition';

import {
  JSONParse, sortedJSONStringify,
} from './util';
import { ApiError } from './errors'
import Signer from './signer';
import Namespace from './namespace';
import { RequestOptions, ServerOptions, NamespaceOptions, ConvertingOptions, FileContent } from './types';
import { Readable, PassThrough } from 'stream';

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
    let portStr: string;
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

  async parseResponseError(response: Response) {
    let result: any;
    if (response.headers.get('content-type').indexOf('application/json') === 0) {
      result = await response.json();
      if (result && result.status && result.message && result.errors) {
        throw new ApiError(result.status, result.message, result.errors);
      }
    }
    if (_.isUndefined(result)) {
      result = await response.text();
      throw new ApiError(response.status, 'api_error', result);
    }
  }

  /**
   * Request NDS server and return a stream like object
   * @protected
   * @param options 
   */
  async requestAsStream(options: RequestOptions): Promise<Readable> {
    this.buildUrl(options);
    this.signer.signRequest(options);
    const response = await fetch(options.url, options);
    if (response.status >= 400) {
      this.parseResponseError(response);
    }
    const stream = new PassThrough();
    response.body.pipe(stream);
    return stream;
  }

  /**
   * Request NDS and return a Promise
   * @param options - See [Namespace~RequestOptions](#Namespace..RequestOptions)
   * @returns Promise of request result
   */
  async request<T = any>(options: RequestOptions): Promise<T> {
    this.buildUrl(options);
    this.signer.signRequest(options);
    options.headers = new Headers(options.headers);
    if (options.json) {
      options.headers.set('content-type', contentTypeParser.format({
        type: 'application/json',
        parameters: {
          charset: 'utf-8',
        },
      }));
    }
    const response = await fetch(options.url, options);
    if (response.status >= 400) {
      this.parseResponseError(response);
    }
    const rawContentType = response.headers.get('content-type');
    const contentType = contentTypeParser.parse(rawContentType).type;
    if (!contentType || contentType !== 'application/json') {
      throw new ApiError(400, 'invalid_response', 'expected JSON format');
    }
    const bodyContent = await response.text();
    let body: any;
    let jsonError = false;
    try {
      body = JSONParse(bodyContent);
    } catch (error) {
      jsonError = true;
    } finally {
      if (!_.isObject(body)) {
        jsonError = true;
      }
    }
    if (jsonError) {
      throw new ApiError(400, 'json_parse_error', 'Invalid JSON format');
    }
    return body;
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

  parseRawResponse(response: Response): FileContent {
    if (response.status >= 400) {
      this.parseResponseError(response);
    }
    let filename: string | undefined = undefined;
    const contentLength = parseInt(response.headers.get('content-length')) || undefined;
    const rawContentType = response.headers.get('content-type');
    const contentType = contentTypeParser.parse(rawContentType).type;
    const rawContentDisposition = response.headers.get('content-disposition');
    if (rawContentDisposition) {
      const parsedCD = contentDispositionParser.parse(rawContentDisposition);
      if (parsedCD && parsedCD.parameters) {
        filename = parsedCD.parameters.filename;
      }
    }
    const stream = new PassThrough();
    response.body.pipe(stream);
    return {
      stream,
      contentType,
      contentLength,
      filename,
    }
  }

  async convert(input: FileContent, options: ConvertingOptions = {}): Promise<FileContent> {
    if (!input.stream && !input.buffer) {
      throw new TypeError('invalid file input, missing stream or buffer');
    }
    if (!input.contentType) {
      throw new TypeError('invalid file input, missing contentType');
    }
    const commands = _.flatten(_.entries(options)).join('/')
    const requestOptions: RequestOptions = {
      url: `/convert/${commands}`,
      method: 'POST',
      headers: {
        'Content-Type': input.contentType,
      },
      body: input.stream || input.buffer,
      expires: 5,
    }
    this.buildUrl(requestOptions);
    this.signer.signRequest(requestOptions);
    const response = await fetch(requestOptions.url, requestOptions);
    return this.parseRawResponse(response);
  }

}

export default Client;
