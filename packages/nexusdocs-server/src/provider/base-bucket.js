import crypto from 'crypto';
import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import uuid from 'uuid';
import mimeTypes from 'mime-types';
import { Writable } from 'stream';

import { uuidRegexPattern, promisifyStream } from '~/lib/util';
import UploadStream from './upload-stream';
import { upload } from '~/api/middleware/upload';

export default class BaseBucket extends EventEmitter {

  constructor(provider, bucketName) {
    super();
    this.provider = provider;
    this.name = bucketName;
  }

  openUploadStream(options = {}) {
    const { filename, contentType, fileId, md5, size, skip } = options;
    const id = uuid.v4();
    const uploadOptions = {
      filename: filename || id,
      contentType: contentType || mimeTypes.lookup(filename) || 'application/octet-stream',
    };
    let providerUploadStream = null;
    if (!skip) {
      providerUploadStream = this._openUploadStream(id, { ...uploadOptions });
    }
    const uploadStream = new UploadStream(id, providerUploadStream, {
      ...uploadOptions,
      md5,
      size,
      fileId,
    });
    return uploadStream;
  }
    
  openDownloadStream(id) {
    return this._openDownloadStream(id);
  }

  /**
   * Get upload stream
   * Please overide this method
   * 
   * @param {string} fileId
   * @param {string} [filename] - Provide optional filename to storage
   * @param {object} [options] - upload options
   * @param {string} [options.contentType] - save content-type in storage
   * @returns {Stream.Writable}
   */
  _openUploadStream(fileId, options) {
    throw new Error('method openUploadStream() is not implemented');
  }

  /**
   * Get download stream
   * Please overide this method
   * 
   * @param {string} fileId
   * @param {object} [options] - upload options
   * @param {string} [options.start] - start byte
   * @param {string} [options.end] - end byte
   * @returns {Stream.Writable}
   */
  _openDownloadStream(fileId, options) {
    throw new Error('method openDownloadStream() is not implemented');
  }

  /**
   * Get display or download url of the file
   * Please overide this method
   * 
   * @param {string} fileId
   * @param {object} [options] - download options
   * @param {string} [options.filename] - for Content-Disposition header for download
   * @param {string} [options.contentType] - for Content-Type header
   * @returns {string} - full url of the file
   */
  getUrl(fileId, options) {
    throw new Error('method _getUrl() is not implemented');
  }

  getDownloadUrl(fileId, filename) {
    return this.getUrl(fileId, { filename });
  }

  delete() {
    throw new Error('method delete() is not implemented');
  }

  drop() {
    throw new Error('method drop() is not implemented');
  }

  getMeta() {
    throw new Error('method find() is not implemented');
  }
  
  rename() {
    throw new Error('method rename() is not implemented');
  }
  
  
}
