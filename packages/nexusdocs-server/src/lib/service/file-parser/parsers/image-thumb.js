import _ from 'lodash';
import gm from 'gm';
import dataurl from 'dataurl';
import BaseParser from '../base-parser';

export default class ImageThumbParser extends BaseParser {

  static key = 'image';
  static extensions = [
    'gif',
    'jpeg',
    'jpg',
    'png',
  ];
  static needBuffer = false;

  init(options) {
    this.options = _.defaults(options, {
      thumbSize: 48,
    });
  }

  parse() {
    const { stream, filename } = this;
    return new Promise((resolve, reject) => {
      const { thumbSize } = this.options;
      gm(stream, filename)
      .resize(thumbSize, thumbSize)
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
