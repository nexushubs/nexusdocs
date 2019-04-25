import { Readable } from 'stream';
import { CoreOptions } from 'request';

export type FileId = string;
export type Query = { [key: string]: string | number };

/**
 * Server options
 */
export interface ServerOptions {
  clientKey?: string; //- NDS API key
  clientSecret?: string; // NDS API secret
  hostname?: string; // hostname
  secure?: boolean; // Whether to use HTTPS
  port?: number; // Server Port
  endPoint?: string; // API endpoint
  defaultUrlExpires?: number; // Default expires seconds
  defaultRequestExpires?: number; // Default expires seconds
}

export interface NamespaceOptions {

}

/**
 * Request options for [request](https://github.com/request/request#requestoptions-callback),
 * some properties are added for additional use, see specified method
 */
export interface RequestOptions extends CoreOptions {
  // HTTP method of the request
  method?: string;
  // Path of the request, or full url
  url?: string;
  // query strings
  qs?: Query;
  // Entire body for PATCH, PUT, POST or DELETE, `json` must be `true` and only plain object is allowed
  body?: any;
  // Set to `true` when providing `body`
  json?: boolean;
  // Expires time in second, timestamp or Date object, the request will be invalid after this timestamp
  expires?: number | Date;
  // Additional signature data besides `method`, `url`, `expires`
  signature?: any;
}

export interface UploadUrlOptions extends RequestOptions {
  resumable?: boolean;
}

/**
 * Upload request options
 */
export interface UploadOptions extends RequestOptions {
  // Specify fileId, see [FileId](#Namespace..FileId)
  fileId?: FileId;
  // Provide filename
  filename?: string;
  // MD5 hash of the file if available
  md5?: string;
  // Provide content-type for download
  contentType?: string;
  // Provide stream total length if available
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
  // Download from the origin provider
  origin?: boolean;
  // Download with the original filename
  download?: boolean;
  // Download with new filename, this will set contentType & contentDisposition
  filename?: string;
  // Overwrite response header
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
  // Image width
  width: number;
  // Image height
  height: number;
  // Image type, e.g. jpeg, png, gif
  type: number;
  // Image thumbnail data-url
  thumbnailUrl: string;
}

/**
 * Zip file entry holds file basic information in zip file
 */
export interface ZipFileEntry {
  // Relative path to zip archive
  path: string;
  // Stored size
  size: number;
  // Last modified date
  lastModified: Date;
}

/**
 * Zip file info holds file basic information in zip file
 */
export interface ZipInfo {
  // files
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
  // Namespace file is stored in
  namespace: string;
  // MD5 hash string
  md5: string;
  // File content type
  contentType: string;
  // File total length
  size: number;
  // Additional information
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
  quality?: number
}
