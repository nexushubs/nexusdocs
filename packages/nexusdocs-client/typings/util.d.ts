/// <reference types="node" />
import { Readable, Writable } from 'stream';
export declare function promisifyStream(stream: Readable | Writable): Promise<{}>;
export declare function getTimestamp(t?: Date | number): number;
export declare function urlSafeBase64Encode(str: string): string;
export declare function sortedJSONStringify(obj: any): string;
export declare function sortObjectKey(obj: any): {};
export declare function addUrlParams(url: any, params: any): string;
export declare function JSONParse(str: string): any;
