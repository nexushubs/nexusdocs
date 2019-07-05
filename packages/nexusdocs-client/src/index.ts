// Only enable source-map in development
// import 'source-map-support/register';

/**
 * @module nexusdocs-client
 */

import Client from './client';
import Namespace from './namespace';
import { ServerOptions } from './types';

export { Client, Namespace };

/**
 * Create a NexusDocs client instance
 * @example Create a client
 * 
 * ```javascript
   const createClient = require('nexusdocs-client');
   
   // Object style server options:
   const client = createClient({
     hostname: '192.168.1.6',
     port: 4001,
     apiKey: 'MY_API_KEY',
     apiSecret: 'MY_API_SECRET',
   });
   
   // URL style server options:
   const client = createClient('http://MY_API_KEY:MY_API_SECRET@192.168.1.6:4001/api');
   ```
 *
 * @see [new Client()](#new_Client_new)
 */
export default function createClient(options: ServerOptions) {
  return new Client(options);
}

module.exports = createClient;
