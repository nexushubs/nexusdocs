import 'source-map-support/register';
/**
 * @module nexusdocs-client
 */
import Client from './client';
import Namespace from './namespace';
import { ServerOptions } from './types';
/**
 * Create a NexusDocs client instance
 * @example Create a client (es module)
 *
 * ```javascript
   import { Client } from 'nexusdocs-client';
   
   // Object style server options:
   const client = new Client({
     hostname: '192.168.1.6',
     port: 4001,
     apiKey: 'MY_API_KEY',
     apiSecret: 'MY_API_SECRET',
   });
   
   // URL style server options:
   const client = new Client('http://MY_API_KEY:MY_API_SECRET@192.168.1.6:4001/api');
   ```
 *
 * @see [new Client()](#new_Client_new)
 */
declare function createClient(options: ServerOptions): Client;
export { Client, Namespace, createClient };
export default createClient;
