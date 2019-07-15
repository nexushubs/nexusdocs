import * as _ from 'lodash';
import * as mime from 'mime-types';
import * as getStream from 'get-stream';
import { Readable, PassThrough } from 'stream';

import { getExtension, getBasename } from './util';
import { IFileContent } from '../types/file';

export type ReadStreamGetter = () => Promise<Readable>;

export class FileContent implements IFileContent {

  static from(data: IFileContent) {
    if (data instanceof FileContent) {
      return data;
    } else if (_.isPlainObject(data)) {
      return new FileContent(data);
    } else {
      throw new TypeError('invalid data type');
    }
  }

  private _data: IFileContent;

  constructor(data: IFileContent = {}) {
    this._data = data || {};
    if (!this.stream) {
      this.stream = new PassThrough;
    }
  }

  get stream() {
    return this._data.stream;
  }

  set stream(stream: Readable) {
    this._data.stream = stream;
  }

  get getStream() {
    return this._data.getStream;
  }

  set getStream(getStream: ReadStreamGetter) {
    this._data.getStream = getStream;
  }

  async loadStream() {
    if (this.getStream && _.isFunction(this.getStream)) {
      this.stream = await this.getStream();
    }
  }

  get contentType() {
    return this._data.contentType;
  }

  set contentType(contentType: string) {
    this._data.contentType = contentType;
  }

  get filename() {
    return this._data.filename;
  }

  set filename(filename: string) {
    const format = getExtension(filename);
    this._data.filename = filename;
    this._data.format = format;
    this._data.contentType = mime.contentType(format) || 'application/octet-stream';
  }

  private replaceExt(format: string) {
    const basename = getBasename(this.filename || '');
    this._data.filename = `${basename}.${format}`;
  }

  get format() {
    return this._data.format;
  }

  set format(format: string) {
    this._data.format = format;
    this.replaceExt(format);
    this._data.contentType = mime.contentType(format) || 'application/octet-stream';
  }

  get buffer() {
    return this._data.buffer;
  }

  set buffer(buffer: Buffer) {
    this._data.buffer = buffer;
  }

  async readToBuffer() {
    const buffer = await getStream.buffer(this.stream);
    this._data.buffer = buffer;
    return buffer;
  }

} 
