import { getExtension } from '~/lib/util';

export default class BaseConverter {
  
  filePath = null;
  
  constructor(stream, filename, buffer, options = {}) {
    this.stream = stream;
    this.filename = filename;
    this.buffer = buffer;
    let format = getExtension(filename);
    const { formatMap } = this.constructor;
    if (formatMap && formatMap[format]) {
      format = formatMap[format];
    }
    this.format = format;
    this.options = options;
  }

  prepare(command, options) {
    // overwrite this method
    throw new Error('FileConverter: prepare() method not overwrited');
  }

  getFormat() {
    return this.format;
  }

}
