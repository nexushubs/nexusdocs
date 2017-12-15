import crypto from 'crypto';
import mime from 'mime-types';
import { Transform } from 'stream';

import { app } from '~/init/application';
import { promisifyEvent } from '~/lib/util';

export default class UploadStream extends Transform {

  constructor(id, uploadStream, options = {}) {
    super();
    app().bindLoader(this);
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
    this.hasher = crypto.createHash('md5');
    this.metadata = {};
    if (uploadStream) {
      this.initStream();
    } else {
      this.skipUpload();
    }
  }

  _transform(data, encoding, callback) {
    this.hasher.update(data);
    this.length += Buffer.byteLength(data);
    this.push(data);
    callback();
  }

  initStream() {
    const { FileParser } = this.service();
    FileParser.parse(this.filename, this);
    this.uploadStream.on('error', (err) => {
      this.emit('error', err);
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
      _id: this.id,
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
      _id: this.id,
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

  getFileInfo() {
    const info = {
      filename: this.filename,
      contentType: this.contentType,
      files_id: this.options.fileId,
    };
    return info;
  }

  start() {
    const info = {
      _id: this.id,
      ...this.getFileInfo(),
      status: 'pending',
      dateStarted: this.dateStarted,
    };
    this.emit('start', info);
  }

  async finish() {
    this.dateUploaded = new Date;
    this.size = this.length;
    this.md5 = this.hasher.digest('hex');
    const info = {
      _id: this.id,
      ...this.getFileInfo(),
      size: this.size,
      md5: this.md5,
      status: 'ok',
      dateStarted: this.dateStarted,
      dateUploaded: this.dateUploaded,
      metadata: this.metadata,
    };
    console.log('UploadStream.upload(), info =', info);
    this.emit('upload', info);
  }
}
