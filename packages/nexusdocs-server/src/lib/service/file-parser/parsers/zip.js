import unzip from 'unzip';
import BaseParser from '../base-parser';

export default class ZipParser extends BaseParser {

  static extensions = ['.zip'];

  entries = [];

  parse() {
    const { stream } = this;
    stream.pipe(unzip.Parse());
    stream.on('entry', entry => {
      const entryData = {
        path: entry.path,
        type: entry.type,
        size: entry.size,
      };
      console.log('unzip::entry, ', entryData);
      this.entries.push(entryData);
      entry.autodrain();
    })
    return new Promise((resolve, reject) => {
      stream.on('end', () => {
        setTimeout(() => {
          const metadata = {
            entries: this.entries,
          };
          resolve(metadata);
        }, 1000);
      });
      stream.on('error', reject);
    });
  }
  
}
