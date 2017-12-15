import zipStreamParser from 'zip-stream-parser';
import BaseParser from '../base-parser';

export default class ZipParser extends BaseParser {

  static extensions = ['zip'];

  parse() {
    const { stream } = this;
    return new Promise((resolve, reject) => {
      stream
        .pipe(zipStreamParser.Parse())
        .on('entry', entry => {
          entry.autodrain();
        })
        .on('cd.entries', entries => {
          resolve({
            entries,
          });
        })
        .on('error', reject);
    });
  }
  
}
