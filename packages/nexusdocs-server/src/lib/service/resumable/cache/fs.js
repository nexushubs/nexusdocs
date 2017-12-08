import fs from 'fs';
import os from 'os';
import mkdirp from 'mkdirp';
import _ from 'lodash';

import { promisifyStream, promisifyAll } from '~/lib/util';
import Base from '../base-cache';

const _fs = promisifyAll(fs, ['unlink']);

export default class FSCache extends Base {

  constructor(handler) {
    super();
    this.handler = handler;
    this.tempDir = `${os.tmpdir()}/nexusdocs/resumable`;
    mkdirp.sync(this.tempDir);
  }

  getFilePath(identifier, index) {
    return `${this.tempDir}/${identifier}-${index}`;
  }

  getFiles(params) {
    return _.range(1, params.totalChunks + 1).map(index => this.getFilePath(params.identifier, index));
  }

  createWriteStream(params, readableStream) {
    const {
      identifier,
      chunkNumber,
    } = params;
    const fileName = this.getFilePath(identifier, chunkNumber);
    console.log('$ writing: ', fileName);
    const fileStream = fs.createWriteStream(fileName);
    readableStream.pipe(fileStream);
    return fileStream;
  }

  createPartialReadStream(identifier, index) {
    const filePath = this.getFilePath(identifier, index);
    return fs.createReadStream(filePath);
  }

  createReadStream(params, writableStream) {
    const {
      identifier,
      totalChunks,
    } = params;
    let index = 0;
    const readPart = () => {
      index++;
      if (totalChunks && index > totalChunks) {
        writableStream.end();
        this.cleanUp(params);
        return;
      }
      const fileStream = this.createPartialReadStream(identifier, index);
      fileStream.on('error', err => {
        writableStream.end();
      });
      fileStream.on('end', () => {
        readPart();
      });
      fileStream.pipe(writableStream, { end: false });
    }
    readPart();
  }

  cleanUp(params) {
    const files = this.getFiles(params);
    return Promise.all(files.map(file => _fs.unlink(file)));
  }

}
