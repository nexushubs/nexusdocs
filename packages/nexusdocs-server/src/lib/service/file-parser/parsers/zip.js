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
          entries = entries.map(entry => ({
            type: entry.type,
            path: entry.path,
            size: entry.uncompressedSize,
            lastModified: entry.lastModified,
          }));
          resolve({ entries });
        })
        .on('error', error => {
          console.error('ZipParser error:', error);
          // resolve({});
        });
        // .on('error', reject);
    });
  }
  
}
