
export default class BaseCache {

  init() {
  }

  /**
   * @param  {string} identifier
   * @param  {number} index
   */
  getFilePath(identifier, index) {
  }

  /**
   * @param  {string} identifier
   */
  getFiles(identifier) {
  }

  /**
   * @param  {object} params
   */
  chechChunkStatus(params) {
  }

  /**
   * @param  {object} params
   */
  checkStatus(params) {
  }
  
  /**
   * @param  {string} identifier
   * @param  {int} index
   * @param  {ReadableStream} readableStream
   */
  createWriteStream(identifier, index, readableStream) {
  }

  /**
   * @param  {string} identifier
   * @param  {int} index
   */
  createPartialReadStream(identifier, index) {
  }

  createReadStream(identifier, writableStraem) {
  }

  cleanUp(identifier) {
  }

}
