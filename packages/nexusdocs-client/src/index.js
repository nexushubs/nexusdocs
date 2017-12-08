import 'source-map-support/register';

/**
 * @module nexusdocs-client
 */

import Client from './client';
import Namespace from './namespace';

export { Client, Namespace };

/**
 * Create a NexusDocs client instance
 * @example ES6 module example
 * 
 * ```javascript
 * import createNDSClient from 'nexusdocs-client';
 * 
 * const NDS = createNDSClient({
 *   hostname: '192.168.1.6',
 *   port: 4001,
 *   apiKey: 'API_KEY',
 *   apiSecret: 'API_SECRET',
 * });
 * 
 * // URL style options:
 * 
 * const NDS = createNDSClient('http://mykey:mysecret@192.168.1.6:4001/api');
 * ```
 *
 * @param {object} options 
 * @see [new Client()](#new_Client_new)
 * @returns {Client}
 */
export default function createClient(options) {
  return new Client(options);
}

module.exports = createClient;
