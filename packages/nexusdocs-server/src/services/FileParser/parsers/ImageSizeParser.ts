import * as imageSize from 'image-size';
import BaseParser from '../BaseParser';
import { IFileParser } from '../types';

export default class ImageSizeParser extends BaseParser implements IFileParser {

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
    const { buffer } = this;
    return imageSize(buffer);
  }
  
}
