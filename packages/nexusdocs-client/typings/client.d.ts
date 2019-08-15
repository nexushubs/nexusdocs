/// <reference types="node" />
import { Response } from 'node-fetch';
import Signer from './signer';
import Namespace from './namespace';
import { RequestOptions, ServerOptions, NamespaceOptions, ConvertingOptions, FileContent } from './types';
import { Readable } from 'stream';
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
    parseResponseError(response: Response): Promise<void>;
    /**
     * Request NDS server and return a stream like object
     * @protected
     * @param options
     */
    requestAsStream(options: RequestOptions): Promise<Readable>;
    /**
     * Request NDS and return a Promise
     * @param options - See [Namespace~RequestOptions](#Namespace..RequestOptions)
     * @returns Promise of request result
     */
    request<T = any>(options: RequestOptions): Promise<T>;
    /**
     * Get namespace instance
     * @param name - The name
     * @param options - Additional options
     * @returns Namespace instance
     */
    getNamespace(name: string, options: NamespaceOptions): Namespace;
    parseRawResponse(response: Response): FileContent;
    convert(input: FileContent, options?: ConvertingOptions): Promise<FileContent>;
}
export default Client;
