import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import contentDispositionParser from 'content-disposition';
import { PassThrough, Readable } from 'stream';
import decamelize from 'decamelize';

import Client from './client';
import { promisifyStream } from './util';
import {
  NamespaceOptions,
  RequestOptions,
  Query,
  FileId,
  DownloadOptions,
  ConvertingOptions,
  UploadUrlOptions,
  UploadOptions,
  UploadStreamOptions,
} from './types';

const defaultMimeType = 'application/octet-stream';

/**
 * Class presenting NexusDocs namespace instance
 * 
 * @example Create a namespace instance
 * 
 * ```javascript
 * const namespace = client.getNamespace('a.name.space');
 * ```
 */
class Namespace {
  
  public client: Client;
  public name: string;
  public options: NamespaceOptions;
  public baseUrl: string;

  /**
   * Namespace Class constructor
   * @param client - NDS Client instance
   * @param name - The name of namespace
   * @param options
   */
  constructor(client: Client, name: string, options: NamespaceOptions = {}) {
    this.client = client;
    this.name = name;
    this.options = options;
    this.baseUrl = `/namespaces/${this.name}`;
  }

  /**
   * Get URL for upload
   * @param options - Additional options
   * @returns URL for upload
   */
  getUploadUrl(options: UploadUrlOptions = {}) {
    const url = `/namespaces/${this.name}/upload`;
    let { resumable, expires } = options;
    const query: Query = {};
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
   * @param fileId - File identifier
   * @param options - Additional options
   * @returns file URL
   */
  getDownloadUrl(fileId: FileId, options: DownloadOptions = {}): string {
    const { filename, download, origin, response = {}, } = options;
    delete options.filename;
    delete options.download;
    delete options.response;
    const query: Query = {};
    if (filename) {
      response.contentType = mime.contentType(filename) || undefined;
      response.contentDisposition = contentDispositionParser(filename);
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
    } as RequestOptions);
    return this.client.getUrl(options as RequestOptions);
  }

  /**
   * Get the converted file URL for view or download
   * @param fileId - File identifier
   * @param converting - Converting options
   * @param options - Additional options
   * @returns The converted file URL
   */
  getConvertedUrl(fileId: FileId, converting: ConvertingOptions = {}, options: RequestOptions = {}) {
    let str = `${fileId}/convert`;
    _.each(converting, (value, key) => {
      str += `/${key}/${encodeURIComponent(value.toString())}`;
    });
    return this.getDownloadUrl(str, options);
  }

  /**
   * Upload file from Buffer, ReadableStream
   * @param data - File data
   * @param options - Additional options
   * @returns Promise of uploading request
   */
  upload(data: Buffer | Readable, options: UploadOptions) {
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
      contentType = mime.lookup(filename) || undefined;
    }
    if (!contentType) {
      contentType = defaultMimeType;
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
   * @param options - Additional options
   * @returns A writable stream for upload
   */
  openUploadStream(options: UploadStreamOptions) {
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
   * @param filePath - The path of file will be uploaded
   * @param options - Upload options
   * @returns Promise of uploading request
   */
  uploadFromLocal(filePath: string, options: UploadOptions) {
    const fileStream = fs.createReadStream(filePath);
    const contentType = mime.contentType(filePath) || defaultMimeType;
    const filename = path.basename(filePath);
    return this.upload(fileStream, {
      filename,
      contentType,
      ...options
    });
  }

  /**
   * Get a readable stream for download
   * @param fileId - The file needed to download later
   * @param options - Additional options
   * @returns the readable stream
   */
  openDownloadStream(fileId: FileId, options: RequestOptions = {}) {
    this.getDownloadUrl(fileId, options);
    return this.client.requestAsStream(options);
  }

  /**
   * Download a file to local file-system
   * @param fileId - The file id
   * @param filePath - The path of file will be saved
   * @param options - Additional options
   * @returns Promise of downloading request
   */
  async downloadToLocal(fileId: FileId, filePath: string, options: DownloadOptions = {}) {
    const fileStream = fs.createWriteStream(filePath);
    const stream = await this.openDownloadStream(fileId, options);
    stream.pipe(fileStream);
    return promisifyStream(fileStream);
  }

  /**
   * Get file information
   * @param fileId
   * @returns Promise of file info
   */
  getFileInfo(fileId: FileId) {
    const options = {
      method: 'GET',
      url: `/namespaces/${this.name}/files/${fileId}/info`,
    };
    return this.client.request(options);
  }
  
  /**
   * Delete a file on the server
   * @param fileId - The file to be deleted
   * @returns Promise of deleting request
   */
  delete(fileId: FileId) {
    const options = {
      method: 'DELETE',
      url: `/namespaces/${this.name}/files/${fileId}`,
    };
    return this.client.request(options);
  }

  /**
   * Delete all files in this namespace
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
   * @param files - file id array
   */
  createArchive(files: FileId[]) {
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
   * @param files - file id array
   * @param options - RequestOptions
   */
  getArchiveUrl(files: FileId[], options: DownloadOptions = {}) {
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
   * @param fileId 
   */
  searchSimilarDoc(fileId: FileId) {
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
