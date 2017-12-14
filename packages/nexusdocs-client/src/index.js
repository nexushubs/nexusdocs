import 'source-map-support/register';

/**
 * @module nexusdocs-client
 * @typicalname createClient
 */

import Client from './client';
import Namespace from './namespace';

export { Client, Namespace };

/**
 * Server options
 * @typedef {object} Client~ServerOptions - Server options
 * @property {string} options.clientKey - NDS API key
 * @property {string} options.clientSecret - NDS API secret
 * @property {string} [options.hostname=127.0.0.1] - hostname
 * @property {boolean} [options.secure=false] - Whether to use HTTPS
 * @property {number} [options.port=4000] - Server Port
 * @property {string} [options.endPoint=/api] - API endpoint
 * @property {number} [options.defaultUrlExpires] - Default expires seconds
 * @property {number} [options.defaultRequestExpires] - Default expires seconds
 */

/**
 * Request options for [request](https://github.com/request/request#requestoptions-callback),
 * some properties are added for additional use, see specified method
 * @typedef {object} Namespace~RequestOptions - Request options
 * @property {string} method - HTTP method of the request
 * @property {string} url - Path of the request, or full url
 * @property {string} [body] - Entire body for PATCH, PUT, POST or DELETE, `json` must be `true` and only plain object is allowed
 * @property {boolean} [json] - Set to `true` when providing `body`
 * @property {number|date} [expires] - Expires time in second, timestamp or Date object, the request will be invalid after this timestamp
 * @property {object} [signature] - Additional signature data besides `method`, `url`, `expires`
 */

/**
 * File identifier
 * @typedef {string} Namespace~FileId - UUID v4 format file identifier
 * @example Example file id: `e5ac71cf-a0f0-46b5-9070-268ae97bb769`
 */

/**
 * Create a NexusDocs client instance
 * @example Create a client
 * 
 * ```javascript
 * const createClient = require('nexusdocs-client');
 * 
 * // Object style server options:
 * const client = createClient({
 *   hostname: '192.168.1.6',
 *   port: 4001,
 *   apiKey: 'MY_API_KEY',
 *   apiSecret: 'MY_API_SECRET',
 * });
 * 
 * // URL style server options:
 * const client = createClient('http://MY_API_KEY:MY_API_SECRET@192.168.1.6:4001/api');
 * ```
 *
 * @param {ServerOptions} options - Server options, see [ServerOptions](#Client..ServerOptions)
 * @see [new Client()](#new_Client_new)
 * @returns {Client}
 */
export default function createClient(options) {
  return new Client(options);
}

module.exports = createClient;
