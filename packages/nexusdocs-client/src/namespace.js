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
   * @param {RequestOptions} [options] - Additional options, see [RequestOptions](#Namespace..RequestOptions)
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
   * @param {DownloadOptions} [options] - Additional options, see [DownloadOptions](#Namespace..DownloadOptions)
   * @returns {string} file URL
   */
  getDownloadUrl(fileId, options = {}) {
    const { filename, download, origin, response = {}, } = options;
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
    if (origin) {
      query.origin = 1;
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
   * @param {DownloadOptions} [options] - Additional options, see [DownloadOptions](#Namespace..DownloadOptions)
   * @returns {string} The converted file URL
   */
  getConvertedUrl(fileId, converting = {}, options = {}) {
    let str = `${fileId}/convert`;
    _.each(converting, (value, key) => {
      str += `/${key}/${encodeURIComponent(value)}`;
    });
    return this.getDownloadUrl(str, options);
  }

  /**
   * Upload file from Buffer, ReadableStream
   * @param {data} Buffer|ReadableStream - File data
   * @param {UploadOptions} [options] - Additional options, see [UploadOptions](#Namespace..UploadOptions)
   * @returns {Promise}
   * @fulfil {object} File info when uploading is finished
   * @reject {any} Request error
   */
  upload(data, options) {
    let {
      fileId,
      filename,
      md5,
      contentType,
      knownLength,
      expires,
    } = options;
    delete options.fileId;
    delete options.filename;
    delete options.md5;
    delete options.contentType;
    delete options.knownLength;
    if (!data) {
      throw new TypeError('invalid data');
    }
    if (filename && !contentType) {
      contentType = mime.lookup(filename);
    }
    if (!contentType) {
      contentType = 'application/octet-stream';
    }
    const fields = _.omitBy({
      fileId,
      filename,
      md5,
    }, _.isUndefined);
    _.merge(options, {
      method: 'POST',
      url: `/namespaces/${this.name}/upload`,
      signature: {
        // ...fields
      },
      formData: {
        ...fields,
        file: {
          value: data,
          options: {
            filename,
            contentType,
            knownLength,
          },
        }
      },
    });
    return this.client.request(options)
  }

  /**
   * Get upload stream
   * @param {UploadOptions} [options] - Additional options, see [UploadOptions](#Namespace..UploadOptions)
   * @param {ReadableStream} [options.stream] - Provide readable stream directly
   * @returns {WritableStream} Writable stream for upload
   */
  openUploadStream(options) {
    let {
      stream,
    } = options;
    delete options.stream;
    if (!stream) {
      stream = new PassThrough;
    }
    this.upload(stream, options)
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
   * @param {UploadOptions} options - Upload options
   * @returns {Promise}
   * @fulfil {FileInfo} File info when uploading is finished
   * @reject {any} Request error
   */
  uploadFromLocal(filePath, options) {
    const fileStream = fs.createReadStream(filePath);
    const contentType = mime.contentType(filePath);
    const filename = path.basename(filePath);
    return this.upload(fileStream, {
      filename,
      contentType,
      ...options
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
      url: `/namespaces/${this.name}/archives`,
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
    const { filename } = options;
    const requestOptions = {
      ...options,
      method: 'GET',
      url: `/namespaces/${this.name}/archive`,
      qs: {
        files: files.join(','),
        filename,
      },
    };
    return this.client.getUrl(requestOptions);
  }

  /**
   * Search similar doc of specified file
   * @param {string} fileId 
   */
  searchSimilarDoc(fileId) {
    const requestOptions = {
      method: 'POST',
      url: `/namespaces/${this.name}/search/similar-doc`,
      body: {
        id: fileId,
      },
      json: true,
    };
    return this.client.request(requestOptions);
  }

}

export default Namespace;
