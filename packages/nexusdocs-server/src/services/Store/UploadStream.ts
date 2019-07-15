import * as crypto from 'crypto';
import { Transform, Writable } from 'stream';

import { promisifyEvent } from '../../lib/util';
import { app } from '../../lib/Application';
import { IUploadStreamOptions, IFileUploadInfo } from './types';

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

  constructor(id: string, uploadStream?: Writable, options: IUploadStreamOptions = {}) {
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

  _transform(data: Buffer, encoding: string, callback: () => void) {
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
    this.uploadStream.on('error', (error) => {
      this.emit('error', error);
    });
    Promise.all([
      promisifyEvent(this, 'metadata')
      .then((metadata) => {
        this.metadata = metadata;
      }),
      promisifyEvent(this.uploadStream, ['finish']),
    ]).then(() => {
      this.finish();
    })
    .catch(error => this.emit('error', error));
    FileParser.parse({
      stream: this,
      filename: this.filename,
      contentType: this.contentType,
    })
    .catch(error => this.emit('error', error));
    this.pipe(this.uploadStream);
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
      let chunk: any;
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
    const info: IFileUploadInfo = {
      ...this.getFileInfo(),
      size: this.size,
      md5: this.md5,
      status: 'ok',
      dateStarted: this.dateStarted,
      dateUploaded: this.dateUploaded,
      metadata: this.metadata,
    };
    this.emit('upload', info);
  }
}
