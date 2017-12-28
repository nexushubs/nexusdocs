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
 * const namespace = client.getNamespace('a.name.space');
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
   * @param {object} [options] - Additional options, see [RequestOptions](#Namespace..RequestOptions)
   * @param {boolean} [options.resumable] - If upload with resumbable.js
   * @param {date} [options.expires] - Timestamp the Request will available before
   * @returns {string} URL for upload
   */
  getUploadUrl(options = {}) {
    const url = `/namespaces/${this.name}/upload`;
    let { resumable, expires } = options;
    const query = {};
    if (resumable) {
      query.resumable = 1;
    }
    _.merge(options, {
      method: 'POST',
      url,
      qs: query,
      expires,
    });
    return this.client.getUrl(options);
  }

  /**
   * Get file URL for view or download
   * @param {FileId} fileId - File identifier, see [FileId](#Namespace..FileId)
   * @param {RequestOptions} [options] - Additional options, see [RequestOptions](#Namespace..RequestOptions)
   * @param {boolean} [options.download=false] - Download with the original filename
   * @param {string} [options.filename] - Download with new filename, this will set contentType & contentDisposition
   * @param {object} [options.response] - Overwrite response header
   * @param {string} [options.response.contentType] - Overwrite Content-Type
   * @param {string} [options.response.contentDisposition] - Overwrite Content-Disposition
   * @returns {string} file URL
   */
  getDownloadUrl(fileId, options = {}) {
    const { filename, download, response = {} } = options;
    delete options.filename;
    delete options.download;
    delete options.response;
    const query = {};
    if (filename) {
      response.contentType = mime.contentType(filename);
      response.contentDisposition = contentDisposition(filename);
    }
    if (download) {
      query.download = 1;
    }
    _.each(response, (value, key) => {
      key = 'response-' + decamelize(key, '-');
      query[key] = value;
    });
    _.merge(options, {
      ...options,
      method: 'GET',
      url: `/namespaces/${this.name}/files/${fileId}`,
      qs: query,
    });
    return this.client.getUrl(options);
  }

  /**
   * Get the converted file URL for view or download
   * @param {FileId} fileId - File identifier, see [FileId](#Namespace..FileId)
   * @param {ConvertingOptions} converting - Converting options, see [ConvertingOptions](#Namespace..ConvertingOptions)
   * @param {RequestOptions} [options] - Additional options, see [RequestOptions](#Namespace..RequestOptions)
   * @param {boolean} [options.download=false] - Download with the original filename
   * @param {string} [options.filename] - Download with new filename, this will set contentType & contentDisposition
   * @param {object} [options.response] - Overwrite response header
   * @param {string} [options.response.contentType] - Overwrite Content-Type
   * @param {string} [options.response.contentDisposition] - Overwrite Content-Disposition
   * @returns {string} The converted file URL
   */
  getConvertedUrl(fileId, converting = {}, options = {}) {
    const str = '${fileId}/convert';
    _.each(converting, (value, key) => {
      str += `/${key}/${encodeURIComponent(value)}`;
    });
    return this.getDownloadUrl(str, options);
  }

  /**
   * Get upload stream
   * @param {RequestOptions} [options] - Additional options, see [RequestOptions](#Namespace..RequestOptions)
   * @param {ReadableStream} [options.stream] - Provide readable stream directly
   * @param {FileId} [options.fileId] - Specify fileId, see [FileId](#Namespace..FileId)
   * @param {string} [options.filename] - Provide filename
   * @param {string} [options.contentType] - Provide content-type for download
   * @param {number} [options.knownLength] - Provide stream total length if available
   * @returns {WritableStream} Writable stream for upload
   */
  openUploadStream(options) {
    let { fileId, filename, contentType, stream, knownLength, expires } = options;
    delete options.fileId;
    delete options.filename;
    delete options.contentType;
    delete options.stream;
    delete options.knownLength;
    if (!stream) {
      stream = new PassThrough;
    }
    if (filename && !contentType) {
      contentType = mime.lookup(filename);
    }
    if (!contentType) {
      contentType = 'application/octet-stream';
    }
    _.merge(options, {
      method: 'POST',
      url: `/namespaces/${this.name}/upload`,
      signature: {
        fileId,
        filename,
        contentType,
        knownLength,
      },
      formData: {
        fileId,
        file: {
          value: stream,
          options: {
            filename,
            contentType,
            knownLength,
          },
        }
      },
    });
    this.client.request(options)
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
   * @param {FileId} fileId - The file needed to download later, see [FileId](#Namespace..FileId)
   * @param {RequestOptions} [options] - Additional options, see [RequestOptions](#Namespace..RequestOptions)
   * @returns {ReadableStream} - the readable stream
   */
  openDownloadStream(fileId, options = {}) {
    
    this.getDownloadUrl(fileId, options);
    return this.client.requestAsStream(options);
  }

  /**
   * Download a file to local file-system
   * @param {FileId} fileId - The file id, see [FileId](#Namespace..FileId)
   * @param {string} filePath - The path of file will be saved
   * @param {RequestOptions} [options] - Additional options, see [RequestOptions](#Namespace..RequestOptions)
   * @returns {Promise}
   * @fulfil {any} Download finished
   */
  downloadToLocal(fileId, filePath, options = {}) {
    const fileStream = fs.createWriteStream(filePath);
    const stream = this.openDownloadStream(fileId, options);
    stream.pipe(fileStream);
    return promisifyStream(fileStream);
  }

  /**
   * Get file information
   * @param {FileId} fileId
   * @returns {Promise}
   * @fulfil {FileInfo} file information
   */
  getFileInfo(fileId) {
    const options = {
      method: 'GET',
      url: `/namespaces/${this.name}/files/${fileId}/info`,
    };
    return this.client.request(options);
  }
  
  /**
   * Delete a file on the server
   * @param {FileId} fileId - The file to be deleted, see [FileId](#Namespace..FileId)
   * @returns {Promise}
   * @fulfil {object} When deletion is finished
   * @reject {any} When a error occur
   */
  delete(fileId) {
    const options = {
      method: 'DELETE',
      url: `/namespaces/${this.name}/files/${fileId}`,
    };
    return this.client.request(options);
  }

  /**
   * Delete all files in this namespace
   * @returns {Promise}
   */
  truncate() {
    const options = {
      method: 'POST',
      url: `/namespaces/${this.name}/truncate`,
    };
    return this.client.request(options);
  }

  /**
   * Create an archive
   * @param {FileId[]} files - file id array
   * @returns {Promise}
   */
  createArchive(files) {
    const options = {
      method: 'POST',
      url: `/namespace/${this.name}/archives`,
      body: {
        files,
      },
      json: true,
    };
    return this.client.request(options);
  }

  /**
   * Archive files then return download URL
   * @param {FileId[]} files - file id array, see [FileId](#Namespace..FileId)
   * @param {RequestOptions} options - RequestOptions, see [RequestOptions](#Namespace..RequestOptions)
   */
  getArchiveUrl(files, options = {}) {
    return this.createArchive(files)
    .then(archive => {
      const { _id: archive_id } = archive;
      _.merge(options, {
        method: 'GET',
        url: `/namespace/${this.name}/archives/${archive_id}`,
      });
      return this.client.buildUrl(options);
    });
  }

}

export default Namespace;
