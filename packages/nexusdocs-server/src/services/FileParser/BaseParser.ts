import { Readable } from 'stream';
import Base from '../../lib/Base';

export default class BaseParser extends Base {

  public filename: string;
  public stream: Readable;
  public buffer: Buffer;
  protected options: any;

  constructor(filename: string, stream: Readable = null, buffer: Buffer = null, options: any = null) {
    super();
    this.filename = filename;
    this.stream = stream;
    this.buffer = buffer;
    this.options = options;
  }

}
