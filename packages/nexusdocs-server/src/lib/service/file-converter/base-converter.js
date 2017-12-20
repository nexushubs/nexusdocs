import { getExtension } from '~/lib/util';

export default class BaseConverter {
  
  constructor(stream, filename) {
    this.stream = stream;
    this.filename = filename;
    let format = getExtension(filename);
    const { formatMap } = this.constructor;
    if (formatMap && formatMap[format]) {
      format = formatMap[format];
    }
    this.format = format;
  }

  prepare(command, options) {
    // overwrite this method
    throw new Error('FileConverter: prepare() method not overwrited');
  }

  getFormat() {
    return this.format;
  }

}
