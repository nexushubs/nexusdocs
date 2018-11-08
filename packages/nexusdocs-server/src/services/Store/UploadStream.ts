import * as crypto from 'crypto';
import * as mime from 'mime-types';
import { Transform, Readable, Writable } from 'stream';

import { promisifyEvent } from '../../lib/util';
import { app } from '../../lib/Application';
import { IUploadStreamOptions } from './types';

export default class UploadStream extends Transform {

  private dateStarted: Date;
  private dateUploaded: Date;
  private id: string;
  private md5: string;
  private size: number;
  private uploadStream: Writable;
  private options: any;
  private filename: string;
  private contentType: string;
  private length: number;
  private hash: crypto.Hash;
  private metadata: any;

  constructor(id, uploadStream, options: IUploadStreamOptions = {}) {
    super();
    const { filename, contentType, md5, size } = options;
    this.dateStarted = new Date;
    this.id = id;
    this.md5 = md5;
    this.size = size;
    this.uploadStream = uploadStream;
    this.options = options;
    this.filename = filename || id;
    this.contentType = contentType;
    this.length = 0;
    this.hash = crypto.createHash('md5');
    this.metadata = {};
    if (uploadStream) {
      this.initStream();
    } else {
      this.skipUpload();
    }
  }

  _transform(data, encoding, callback) {
    this.hash.update(data);
    this.length += Buffer.byteLength(data);
    this.push(data);
    callback();
  }

  getFileInfo() {
    return {
      _id: this.id,
      filename: this.filename,
      contentType: this.contentType,
      files_id: this.options.fileId,
    };
  }

  initStream() {
    const { FileParser } = app().services;
    FileParser.parse(this.filename, this)
    .catch(error => this.emit('error', error));
    this.uploadStream.on('error', (error) => {
      this.emit('error', error);
    });
    this.pipe(this.uploadStream);
    promisifyEvent(this, ['metadata', 'finish'])
    .then(([metadata]) => {
      this.metadata = metadata;
      this.finish();
    });
    setImmediate(() => {
      this.start();
    });
  }

  skipUpload() {
    setImmediate(() => {
      this._skipUpload();
    });
  }

  _skipUpload() {
    this.dateUploaded = new Date;
    this.emit('start', {
      ...this.getFileInfo(),
      status: 'skip',
      dateStarted: this.dateStarted,
    })
    this.on('readable', () => {
      let chunk;
      while (null !== (chunk = this.read())) {
      }
    });
    this.emit('upload', {
      ...this.getFileInfo(),
      size: this.size,
      md5: this.md5,
      status: 'skipped',
      dateStarted: this.dateStarted,
      dateUploaded: this.dateUploaded,
    });
    this.on('finish', () => {
      // console.log('!!! fake upload finished!');
    })
  }

  start() {
    const info = {
      ...this.getFileInfo(),
      status: 'pending',
      dateStarted: this.dateStarted,
    };
    this.emit('start', info);
  }

  async finish() {
    this.dateUploaded = new Date;
    this.size = this.length;
    this.md5 = this.hash.digest('hex');
    const info = {
      ...this.getFileInfo(),
      size: this.size,
      md5: this.md5,
      status: 'ok',
      dateStarted: this.dateStarted,
      dateUploaded: this.dateUploaded,
      metadata: this.metadata,
    };
    // console.log('UploadStream.upload(), info =', info);
    this.emit('upload', info);
  }
}
