import * as request from 'request';
import Signer from './signer';
import Namespace from './namespace';
import { RequestOptions, ServerOptions, NamespaceOptions } from './types';
/**
 * Class presenting NexusDocs client instance
 */
declare class Client {
    options: ServerOptions;
    defaultOptions: ServerOptions;
    signer: Signer;
    /**
     * Creates an instance of NDS Client.
     * @example
     * You can pass a URL sting instead of a config object:
     * ```xml
     * http://<clientKey>:<clientSecret>@<hostname>:<port><endPoint>
     * ```
     * @param options - Server options
     */
    constructor(options?: ServerOptions);
    getFullUrl(url: string): string;
    buildUrl(options: RequestOptions): string;
    getUrl(options: RequestOptions): string;
    /**
     * Request NDS server and return a stream like object
     * @protected
     * @param options
     */
    requestAsStream(options: RequestOptions): request.Request;
    /**
     * Request NDS and return a Promise
     * @protected
     * @ignore
     * @param options - See [Namespace~RequestOptions](#Namespace..RequestOptions)
     * @returns Promise of request result
     */
    request(options: RequestOptions): Promise<{}>;
    /**
     * Get namespace instance
     * @param name - The name
     * @param options - Additional options
     * @returns Namespace instance
     */
    getNamespace(name: string, options: NamespaceOptions): Namespace;
}
export default Client;
