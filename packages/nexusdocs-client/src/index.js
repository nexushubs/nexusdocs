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
 * @property {string} clientKey - NDS API key
 * @property {string} clientSecret - NDS API secret
 * @property {string} [hostname=127.0.0.1] - hostname
 * @property {boolean} [secure=false] - Whether to use HTTPS
 * @property {number} [port=4000] - Server Port
 * @property {string} [endPoint=/api] - API endpoint
 * @property {number} [defaultUrlExpires] - Default expires seconds
 * @property {number} [defaultRequestExpires] - Default expires seconds
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
  * Upload request options
  * @typedef {object} Namespace~UploadOptions - Upload options
  * @extends RequestOptions
  * @property {FileId} [fileId] - Specify fileId, see [FileId](#Namespace..FileId)
  * @property {string} [filename] - Provide filename
  * @property {string} [md5] - MD5 hash of the file if available
  * @property {string} [contentType] - Provide content-type for download
  * @property {number} [knownLength] - Provide stream total length if available
  */

/**
 * Download options
 * @typedef {object} Namespace~DownloadOptions - Download options
 * @extends RequestOptions
 * @property {boolean} [origin=false] - Download from the origin provider
 * @property {boolean} [download=false] - Download with the original filename
 * @property {string} [filename] - Download with new filename, this will set contentType & contentDisposition
 * @property {object} [response] - Overwrite response header
 * @property {string} [response.contentType] - Overwrite Content-Type
 * @property {string} [response.contentDisposition] - Overwrite Content-Disposition
 */

/**
 * File identifier
 * @typedef {string} Namespace~FileId - UUID v4 format file identifier
 * @example Example file id: `e5ac71cf-a0f0-46b5-9070-268ae97bb769`
 */

/**
 * Image file info
 * @typedef {object} Namespace~ImageInfo holds file basic information of image file
 * @property {number} width - Image width
 * @property {number} height - Image height
 * @property {number} type - Image type, e.g. jpeg, png, gif
 * @property {string} thumbnailUrl - Image thumbnail data-url
 */

/**
 * Zip file entry
 * @typedef {object} Namespace~ZipFileEntry holds file basic information in zip file
 * @property {string} path - Relative path to zip archive
 * @property {number} size - Stored size
 * @property {date} lastModified - Last modified date
 */

/**
 * Zip file info
 * @typedef {object} Namespace~ZipInfo holds file basic information in zip file
 * @property {ZipFileEntry[]} entries - files
 */

/**
 * File information
 * @typedef {object} Namespace~FileInfo - file information holder
 * @property {string} namespace - Namespace file is stored in
 * @property {string} md5 - MD5 hash string
 * @property {string} contentType - File content type
 * @property {number} size - File total length
 * @property {object} metadata - Additional information
 * @property {ImageInfo} [metadata.image] - Metadata for image files
 * @property {ZipInfo} [metadata.zip] - Zip file entries
 */

/**
 * File converting options
 * @typedef {object} Namespace~ConvertingOptions - file information holder
 * @property {string} format - The output format, `documents`: `pdf`, `image`: `gif`, `jpeg`, `png`, `webp`, `tiff`
 * @property {string} [resize] - For `image`, resize the image `<width>x<height>{%}{@}{!}{<}{>}`
 *    please check [GraphicsMagick](http://www.graphicsmagick.org/GraphicsMagick.html#details-resize).
 *    notice: only `{!}{>}{^}` are available when the server is using `ImageSharpConverter`
 * @property {string|number} [rotate] - For `image`, rotate the image by angle `{auto}{90}{180}{270}`,
 *    if `auto` is set, the angle will be detected by gravity from EXIF
 * @property {number} [quality] - For`image`, set the output image quality 0 - 100, available for format `jpeg`, `tiff`, `webp`
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
