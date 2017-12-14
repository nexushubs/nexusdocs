export default class BaseParser {

  constructor(filename, stream) {
    this.filename = filename;
    this.stream = stream;
  }

  parse() {
    // overwrite this method
  }

}
