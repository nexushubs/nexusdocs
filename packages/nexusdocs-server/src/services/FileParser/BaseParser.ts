import { Readable } from 'stream';

export default class BaseParser {

  public filename: string;
  public stream: Readable;
  public buffer: Buffer;
  protected options: any;

  constructor(filename: string, stream: Readable = null, buffer: Buffer = null, options: any = null) {
    this.filename = filename;
    this.stream = stream;
    this.buffer = buffer;
    this.options = options;
  }

}
