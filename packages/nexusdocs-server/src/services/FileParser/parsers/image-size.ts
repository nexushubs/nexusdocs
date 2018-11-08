import imageSize from 'image-size';
import BaseParser from '../BaseParser';
import { IFileParser } from '../types';

export default class ImageSizeParser extends BaseParser implements IFileParser {

  public key = 'image';
  public extensions = [
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
  public needBuffer = true;

  async parse() {
    const { buffer } = this;
    return imageSize(buffer);
  }
  
}
