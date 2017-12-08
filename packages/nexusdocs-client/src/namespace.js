import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import decamelize from 'decamelize';
import contentDisposition from 'content-disposition';
import { PassThrough } from 'stream';

import Client from './client';
import { promisifyStream, getTimestamp } from './util';

/**
 * Class presenting NexusDocs namespace instance
 * 
 * @example Create a namespace instance
 * 
 * ```javascript
 * const namespace = nds.getNamespace('a.name.space');
 * ```
 * @typicalname namespace
 */
class Namespace {
  
  /**
   * Namespace Class constructor
   * @param {Client} client - NDS Client instance
   * @param {string} name - The name of namespace
   * @param {object} options
   */
  constructor(client, name, options = {}) {
    this.client = client;
    this.name = name;
    this.options = options;
    this.baseUrl = `/namespaces/${this.name}`;
  }

  /**
   * Get URL for upload
   * @param {object} [options] - Additional options
   * @param {boolean} [options.resumable] - If upload with resumbable.js
   * @param {number|Date} [options.expires] - Seconds, timestamp or date, upload must done before this time
   * @returns {string} URL for upload
   */
  getUploadUrl(options = {}) {
    const url = `/namespaces/${this.name}/upload`;
    let { resumable, expires } = options;
    const query = {};
    if (resumable) {
      query.resumable = 1;
    }
    if (!expires) {
      expires = this.client.options.defaultExpires;
    }
    query.e = getTimestamp(expires);
    const urlOptions = {
      qs: query,
      signature: {
        method: 'POST',
      },
    };
    return this.client.buildUrl(url, urlOptions);
  }

  /**
   * Get file URL for view or download
   * @param {string} fileId - File ID (uuid.v4)
   * @param {object} [options] - Additional options
   * @param {number|date} [options.expires] - Seconds, timestamp or date, download must done before this time
   * @param {boolean} [options.download=false] - Download with the original filename
   * @param {string} [options.filename] - Download with new filename
   * @param {string} [options.contentType] - Overwrite Content-Type in response header
   * @param {string} [options.contentDisposition] - Overwrite Content-Disposition in response header
   * @returns {string} file URL
   */
  getDownloadUrl(fileId, options = {}) {
    const { filename, download, response = {} } = options;
    let { expires } = options;
    const query = {};
    if (filename) {
      response.contentDisposition = contentDisposition(filename);
    }
    if (!expires) {
      expires = this.client.options.defaultExpires;
    }
    query.e = getTimestamp(expires);
    if (download) {
      query.download = 1;
    }
    _.each(response, (value, key) => {
      key = 'response-' + decamelize(key, '-');
      query[key] = value;
    });
    const url = `/namespaces/${this.name}/files/${fileId}`;
    const requestOptions = {
      qs: query,
      signature: {
        method: 'GET',
      },
    };
    return this.client.buildUrl(url, requestOptions);
  }

  /**
   * Get upload stream
   * @param {object} [options] - Options
   * @param {string} [options.filename] - Provide filename
   * @param {string} [options.contentType] - Provide content-type for download
   * @returns {WritableStream} Writable stream for upload
   */
  openUploadStream(options) {
    let { fileId, filename, contentType, stream, knownLength, expires } = options;
    if (!stream) {
      stream = new PassThrough;
    }
    if (filename && !contentType) {
      contentType = mime.lookup(filename);
    }
    if (!contentType) {
      contentType = 'application/octet-stream';
    }
    if (!expires) {
      expires = this.client.options.defaultExpires;
    }
    expires = getTimestamp(expires);
    const url = this.getUploadUrl();
    const requestOptions = {
      signature: {
        namespace: this.name,
        fileId,
        expires,
      },
      formData: {
        fileId,
        expires,
        file: {
          value: stream,
          options: {
            filename,
            contentType,
            knownLength,
          },
        }
      },
    };
    this.client.request('POST', url, requestOptions)
    .then(result => {
      stream.emit('file', result);
    })
    .catch(error => {
      stream.emit('error', error);
    });
    return stream;
  }

  /**
   * Upload a file from local file-system
   * @param {string} filePath - The path of file will be uploaded
   * @returns {Promise}
   * @fulfil {object} File info when uploading is finished
   * 
   * ```javascript
   * {
   *   id: string   // Uploaded file id
   *   md5: string  // The MD5 hash of the file
   *   size: number // The total size of the file
   * }
   * ```
   * 
   * @reject {any} Request error
   */
  uploadFromLocal(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const contentType = mime.contentType(filePath);
    const filename = path.basename(filePath);
    const uploadStream = this.openUploadStream( {
      filename,
      contentType,
    });
    fileStream.pipe(uploadStream);
    return new Promise((resolve, reject) => {
      uploadStream.on('file', resolve);
      uploadStream.on('error', reject);
    });
  }

  /**
   * Get a readable stream for download
   * @param {string} fileId - The file id which is needed for download
   * @param {object} [options] - Additional options 
   * @returns {ReadableStream} - the readable stream
   */
  openDownloadStream(fileId, options) {
    const url = this.getDownloadUrl(fileId, options);
    const requestOptions = options;
    return this.client.requestAsStream('GET', url, requestOptions);
  }

  /**
   * Download a file to local file-system
   * @param {string} fileId - The file id
   * @param {string} filePath - The path of file will be saved
   * @param {object} [options] - Additional options
   * @returns {Promise}
   * @fulfil {any} Download finished
   * @reject {any} When a error occur
   */
  downloadToLocal(fileId, filePath, options = {}) {
    const fileStream = fs.createWriteStream(filePath);
    const stream = this.openDownloadStream(fileId, options);
    stream.pipe(fileStream);
    return promisifyStream(fileStream);
  }
  
  /**
   * Delete a file on the server
   * @param {String} fileId - The file will be deleted
   * @returns {Promise}
   * @fulfil {object} When deletion is finished
   * @reject {any} When a error occur
   */
  delete(fileId) {
    const url = `/namespaces/${this.name}/files/${fileId}`;
    return this.client.request('DELETE', url, {
      secure: true,
    });
  }

  /**
   * Delete all files in this namespace
   * @returns {Promise}
   */
  truncate() {
    const url = `/namespaces/${this.name}/truncate`;
    return this.client.request('POST', url);
  }

}

export default Namespace;
