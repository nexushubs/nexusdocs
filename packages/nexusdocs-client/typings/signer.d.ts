import { ServerOptions, RequestOptions } from './types';
/**
 * Class for signing request
 */
export default class Signer {
    options: ServerOptions;
    constructor(options: ServerOptions);
    getToken(str: string): string;
    getSecuredUrl(url: string, signatureBody: any): string;
    getAuthorizationHeader(signature: any, expires: number): string;
    getFullUrl(options: RequestOptions): string;
    /**
     * Sign a URL for secured request
     */
    signUrl(options: any): any;
    /**
     * Sign a request with body
     */
    signRequest(options: RequestOptions): RequestOptions;
}
