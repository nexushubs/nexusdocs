import * as _ from 'lodash';
import * as gm from 'gm';
import dataurl from 'dataurl';

import { staticImplements } from '../../../types/common';
import { IFileParser, IFileParserStatic } from '../types';
import BaseParser from '../BaseParser';

@staticImplements<IFileParserStatic>()
export default class ImageThumbParser extends BaseParser implements IFileParser {

  static key = 'image';
  static extensions = [
    'gif',
    'jpeg',
    'jpg',
    'png',
  ];
  static needBuffer = false;
  
  protected config: any;

  init(options) {
    this.config = _.defaults(options, {
      thumbSize: 48,
    });
  }

  parse() {
    const { stream, filename } = this.input;
    return new Promise((resolve, reject) => {
      const { thumbSize } = this.config;
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
