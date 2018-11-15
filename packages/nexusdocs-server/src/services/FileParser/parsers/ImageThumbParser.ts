import * as _ from 'lodash';
import * as gm from 'gm';
import dataurl from 'dataurl';
import BaseParser from '../BaseParser';
import { IFileParser } from '../types';

export default class ImageThumbParser extends BaseParser implements IFileParser {

  static key = 'image';
  static extensions = [
    'gif',
    'jpeg',
    'jpg',
    'png',
  ];
  static needBuffer = false;
  protected options: any;

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
          console.error(err.stack);
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
