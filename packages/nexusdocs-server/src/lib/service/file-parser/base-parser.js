export default class BaseParser {

  constructor(filename, stream, buffer) {
    this.filename = filename;
    this.stream = stream;
    this.buffer = buffer;
  }

  parse() {
    // overwrite this method
  }

}
