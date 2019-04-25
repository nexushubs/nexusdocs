/// <reference types="node" />
import { Readable } from 'stream';
import { CoreOptions } from 'request';
export declare type FileId = string;
export declare type Query = {
    [key: string]: string | number;
};
/**
 * Server options
 */
export interface ServerOptions {
    clientKey?: string;
    clientSecret?: string;
    hostname?: string;
    secure?: boolean;
    port?: number;
    endPoint?: string;
    defaultUrlExpires?: number;
    defaultRequestExpires?: number;
}
export interface NamespaceOptions {
}
/**
 * Request options for [request](https://github.com/request/request#requestoptions-callback),
 * some properties are added for additional use, see specified method
 */
export interface RequestOptions extends CoreOptions {
    method?: string;
    url?: string;
    qs?: Query;
    body?: any;
    json?: boolean;
    expires?: number | Date;
    signature?: any;
}
export interface UploadUrlOptions extends RequestOptions {
    resumable?: boolean;
}
/**
 * Upload request options
 */
export interface UploadOptions extends RequestOptions {
    fileId?: FileId;
    filename?: string;
    md5?: string;
    contentType?: string;
    knownLength?: number;
}
export interface UploadStreamOptions extends UploadOptions {
    stream: Readable;
}
export interface ResponseOptions {
    contentType?: string;
    contentDisposition?: string;
}
/**
 * Download options
 */
export interface DownloadOptions extends Partial<RequestOptions> {
    origin?: boolean;
    download?: boolean;
    filename?: string;
    response?: ResponseOptions;
}
/**
 * File identifier
 * @typedef {string} Namespace~FileId // UUID v4 format file identifier
 * @example Example file id: `e5ac71cf-a0f0-46b5-9070-268ae97bb769`
 */
/**
 * Image file info holds file basic information of image file
 */
export interface ImageInfo {
    width: number;
    height: number;
    type: number;
    thumbnailUrl: string;
}
/**
 * Zip file entry holds file basic information in zip file
 */
export interface ZipFileEntry {
    path: string;
    size: number;
    lastModified: Date;
}
/**
 * Zip file info holds file basic information in zip file
 */
export interface ZipInfo {
    entries: ZipFileEntry[];
}
export interface FileMetadata {
    image?: ImageInfo;
    zip?: ZipInfo;
}
/**
 * File information
 */
export interface FileInfo {
    namespace: string;
    md5: string;
    contentType: string;
    size: number;
    metadata: FileMetadata;
}
/**
 * File converting options
 * @property format The output format, `documents`: `pdf`, `image`: `gif`, `jpeg`, `png`, `webp`, `tiff`
 * @property resize For `image`, resize the image `<width>x<height>{%}{@}{!}{<}{>}`
 *    please check [GraphicsMagick](http://www.graphicsmagick.org/GraphicsMagick.html#details-resize).
 *    notice: only `{!}{>}{^}` are available when the server is using `ImageSharpConverter`
 * @property rotate For `image`, rotate the image by angle `{auto}{90}{180}{270}`,
 *    if `auto` is set, the angle will be detected by gravity from EXIF
 * @property quality For`image`, set the output image quality 0 // 100, available for format `jpeg`, `tiff`, `webp`
 * @example Get a thumbnail of size 32px
 * ```javascript
 * {
 *   format: 'jpeg',
 *   resize: '32x32',
 *   rotate: 'auto'
 * }
 * ```
 * @example Get a pdf version of a document
 * ```javascript
 * {
 *   format: 'pdf',
 * }
 * ```
 */
export interface ConvertingOptions {
    format?: string;
    resize?: string;
    rotate?: string | number;
    quality?: number;
}
