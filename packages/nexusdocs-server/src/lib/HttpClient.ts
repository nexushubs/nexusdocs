import * as _ from 'lodash';
import * as qs from 'qs';
import fetch, { Response, RequestInit, Headers } from 'node-fetch';
import { EventEmitter } from 'events';
import * as FormData from 'form-data';
import * as contentType from 'content-type';

import { ApiError } from './errors';
import { KeyValueMap } from '../types/common';

export const ContentTypes = {
  FORM_DATA: 'multipart/form-data',
  URLENCODED: 'application/x-www-form-urlencoded',
  JSON: 'application/json',
};

export type HeadersMap = KeyValueMap<string>;

export interface HttpClientOptions {
  headers: {
    default: HeadersMap;
    post: HeadersMap;
  }
}

export interface RequestOptions extends RequestInit {}

class HttpClient extends EventEmitter {

  static ContentTypes = ContentTypes;
  public uri: string;
  public clientOptions: HttpClientOptions;
  
  constructor(uri: string, options: Partial<HttpClientOptions> = {}) {
    super()
    if (!uri) {
      throw new Error('HttpClient: missing server url');
    }
    this.uri = uri,
    this.clientOptions = _.defaultsDeep(options, {
      headers: {
        default: {
          // 'Accept': 'application/json',
        },
      },
    });
  }

  /**
   * Prepare uri with query string
   */
  prepareUri(uri: string, query?: KeyValueMap<string>) {
    uri = encodeURI(uri)
    uri = `${this.uri}${uri}`
    query = _.omitBy(query, _.isUndefined)
    if (!_.isEmpty(query)) {
      uri += `?${qs.stringify(query)}`
    }
    return uri
  }

  async processResponse<T>(res: Response): Promise<T> {
    let result: any = null;
    let type = res.headers.get('content-type');
    if (type.includes(';')) {
      ({ type } = contentType.parse(type));
    }
    if (type === ContentTypes.JSON) {
      result = await res.json();
    } else {
      result = await res.text();
    }
    if (res.status > 200) {
      throw new ApiError(res.status, 'HTTP_CLIENT_ERROR', result)
    }
    return result as T;
  }

  /**
   * Get
   */
  async get<T = any>(uri: string, query?: KeyValueMap<string>, options = {}) {
    uri = this.prepareUri(uri, query)
    this.emit('request', {
      method: 'GET',
      uri,
    })
    const response = await fetch(uri, _.defaultsDeep(options, {
      headers: {
        ...this.clientOptions.headers.default,
      },
    }));
    return this.processResponse<T>(response);
  }

  /**
   * Post like request
   */
  async _post<T>(uri: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', data: any, options: RequestOptions = {}): Promise<T> {
    uri = this.prepareUri(uri)
    this.emit('request', {
      method,
      uri,
    });
    const requestOptions: RequestOptions = _.defaultsDeep(options, {
      method,
    });
    const headers = new Headers({
      ...this.clientOptions.headers.default,
      ...options.headers,
    });
    if (data) {
      if (headers.get('content-type') === ContentTypes.URLENCODED) {
        requestOptions.body = qs.stringify(data);
      } else if (_.isPlainObject(data)) {
        headers.set('content-type', 'application/json; charset=utf8')
        requestOptions.body = JSON.stringify(data);
      } else if (data instanceof FormData) {
        const formDataHeaders = data.getHeaders();
        for (const key in formDataHeaders) {
          headers.set(key, formDataHeaders[key]);
        }
        requestOptions.body = data;
      }
    }
    requestOptions.headers = headers;
    const res = await fetch(uri, requestOptions);
    return this.processResponse<T>(res);
 }

  /**
   * Post request
   */
  post<T>(uri: string, data: any, options?: RequestOptions) {
    return this._post(uri, 'POST', data, options) as Promise<T>;
  }

  /**
   * Put request
   */
  put<T>(uri: string, data: any, options?: RequestOptions) {
    return this._post(uri, 'PUT', data, options) as Promise<T>;
  }

  /**
   * Patch request
   */
  patch<T>(uri: string, data: any, options?: RequestOptions) {
    return this._post(uri, 'PATCH', data, options) as Promise<T>;
  }

  /**
   * Delete request
   */
  delete<T>(uri: string, data: any, options?: RequestOptions) {
    return this._post(uri, 'DELETE', data, options) as Promise<T>;
  }
}

export default HttpClient
