import zipStreamParser from 'zip-stream-parser';

import { staticImplements } from '../../../types/common';
import { IFileParser, IFileParserStatic } from '../types';
import BaseParser from '../BaseParser';

@staticImplements<IFileParserStatic>()
export default class ZipParser extends BaseParser implements IFileParser {

  static key = 'zip';
  static extensions = [
    'zip',
  ];
  static needBuffer = false;

  parse() {
    const { stream } = this.input;
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
