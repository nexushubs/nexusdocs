import gm from 'gm';
import dataurl from 'dataurl';
import BaseParser from '../base-parser';

const THUMB_SIZE = 24;

export default class ImageThumb extends BaseParser {

  static key = 'image';
  static extensions = [
    'gif',
    'jpeg',
    'jpg',
    'png',
  ];
  static needBuffer = false;

  parse() {
    const { stream, filename } = this;
    return new Promise((resolve, reject) => {
      gm(stream, filename)
      .resize(THUMB_SIZE, THUMB_SIZE)
      .toBuffer('JPEG', (err, buffer) => {
        if (err) {
          console.log(err.stack);
          reject(err);
          return;
        }
        const url = dataurl.convert({
          data: buffer,
          mimetype: 'image/jpeg',
        });
        resolve({
          thumbnailUrl: url,
        });
      });
    })
  }
  
}
