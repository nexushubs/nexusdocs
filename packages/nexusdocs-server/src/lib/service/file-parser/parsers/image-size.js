import imageSize from 'image-size';
import BaseParser from '../base-parser';

export default class ImageSizeParser extends BaseParser {

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

  parse() {
    const { buffer } = this;
    return imageSize(buffer);
  }
  
}
