import zipStreamParser from 'zip-stream-parser';
import BaseParser from '../base-parser';

export default class ZipParser extends BaseParser {

  static key = 'zip';
  static extensions = [
    'zip',
  ];
  static needBuffer = false;

  parse() {
    const { stream } = this;
    return new Promise((resolve, reject) => {
      stream
        .pipe(zipStreamParser.Parse())
        .on('entry', entry => {
          entry.autodrain();
        })
        .on('cd.entries', entries => {
          resolve({ entries });
        })
        .on('error', reject);
    });
  }
  
}
