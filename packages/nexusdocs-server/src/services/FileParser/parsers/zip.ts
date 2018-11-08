import zipStreamParser from 'zip-stream-parser';
import BaseParser from '../BaseParser';
import { IFileParser } from '../types';

export default class ZipParser extends BaseParser implements IFileParser {

  public key = 'zip';
  public extensions = [
    'zip',
  ];
  public needBuffer = false;

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
