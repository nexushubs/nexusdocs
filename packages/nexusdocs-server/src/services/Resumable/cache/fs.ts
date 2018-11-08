import fs from 'fs';
import os from 'os';
import util from 'util';
import mkdirp from 'mkdirp';
import _ from 'lodash';

import { IResumableCache, ResumableParams, TIdentifier } from '../types';
import { Readable, Writable, PassThrough } from 'stream';

const unlink = util.promisify(fs.unlink);

export default class FSCache implements IResumableCache {

  private handler: any = null;
  private tempDir: string = null;

  constructor(handler) {
    this.handler = handler;
    this.tempDir = `${os.tmpdir()}/nexusdocs/resumable`;
    mkdirp.sync(this.tempDir);
  }

  async init() {

  }

  getFilePath(identifier, index) {
    return `${this.tempDir}/${identifier}-${index}`;
  }

  getFiles(params) {
    return _.range(1, params.totalChunks + 1).map(index => this.getFilePath(params.identifier, index));
  }

  checkStatus(param) {
    return true;
  }

  checkChunkStatus(param) {
    return true;
  }

  createWriteStream(params: ResumableParams): Writable {
    const {
      identifier,
      chunkNumber,
    } = params;
    const fileName = this.getFilePath(identifier, chunkNumber);
    // console.log('$ writing: ', fileName);
    const fileStream = fs.createWriteStream(fileName);
    return fileStream;
  }

  createPartialReadStream(identifier: TIdentifier, index: number): Readable {
    const filePath = this.getFilePath(identifier, index);
    return fs.createReadStream(filePath);
  }

  createReadStream(params: ResumableParams): Readable {
    const writableStream = new PassThrough;
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
    return writableStream;
  }

  cleanUp(params) {
    const files = this.getFiles(params);
    return Promise.all(files.map(file => unlink(file)));
  }

}
