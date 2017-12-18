export default class BaseParser {

  constructor(filename, stream, buffer, options) {
    this.filename = filename;
    this.stream = stream;
    this.buffer = buffer;
    this.options = options;
  }

  parse() {
    // overwrite this method
  }

}
