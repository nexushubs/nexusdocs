import { getExtension } from '../../lib/util';
import { Readable } from 'stream';

export default class BaseConverter {
  
  filePath = null;
  public extensions: string[] = [];
  public formatMap: {[key: string]: string} = {};
  public stream: Readable;
  public filename: string;
  public format: string;
  public buffer: Buffer;
  public options: any;
  public needBuffer = false;
  public needFile = false;
  
  constructor(stream: Readable, filename: string, buffer: Buffer, options: any = {}) {
    this.stream = stream;
    this.filename = filename;
    this.buffer = buffer;
    let format = getExtension(filename);
    const { formatMap } = this;
    if (formatMap && formatMap[format]) {
      format = formatMap[format];
    }
    this.format = format;
    this.options = options;
  }

  getFormat() {
    return this.format;
  }

}
