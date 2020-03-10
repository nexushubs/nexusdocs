import { imageSize } from 'image-size';

import { staticImplements } from '../../../types/common';
import { IFileParser, IFileParserStatic } from '../types';
import BaseParser from '../BaseParser';

@staticImplements<IFileParserStatic>()
export default class ImageSizeParser extends BaseParser implements IFileParser<'image'> {

  static key = 'image';
  static extensions = [
    'bmp',
    'cur',
    'gif',
    'ico',
    'jpeg',
    'jpg',
    'png',
    'psd',
    'tiff',
    'webp',
    'svg',
    'dds',
  ];
  static needBuffer = true;

  async parse() {
    const { buffer } = this.input;
    return imageSize(buffer);
  }
  
}
