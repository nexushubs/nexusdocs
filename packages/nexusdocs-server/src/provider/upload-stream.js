import crypto from 'crypto';
import mimeTypes from 'mime-types';
import { Transform } from 'stream';

export default class UploadStream extends Transform {

  constructor(id, uploadStream, options = {}) {
    super();
    const { filename, contentType, md5, size } = options;
    this.startDate = new Date;
    this.id = id;
    this.md5 = md5;
    this.size = size;
    this.uploadStream = uploadStream;
    this.options = options;
    this.filename = filename || id;
    this.contentType = contentType;
    this.length = 0;
    this.hasher = crypto.createHash('md5');
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
    // calculating file size
    this.uploadStream.on('finish', () => {
      this.finish();
    });
    this.uploadStream.on('error', (err) => {
      this.emit('error', err);
    });
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
    this.uploadDate = new Date;
    this.emit('start', {
      _id: this.id,
      ...this.getFileInfo(),
      status: 'skip',
      startDate: this.startDate,
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
      startDate: this.startDate,
      uploadDate: this.uploadDate,
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
      startDate: this.startDate,
    };
    this.emit('start', info);
  }

  async finish() {
    this.uploadDate = new Date;
    this.size = this.length;
    this.md5 = this.hasher.digest('hex');
    const info = {
      _id: this.id,
      ...this.getFileInfo(),
      size: this.size,
      md5: this.md5,
      status: 'ok',
      startDate: this.startDate,
      uploadDate: this.uploadDate,
    };
    this.emit('upload', info);
  }
}
