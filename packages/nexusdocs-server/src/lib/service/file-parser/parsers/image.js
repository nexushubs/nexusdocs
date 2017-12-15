import imageSize from 'image-size';
import BaseParser from '../base-parser';

export default class ImageParser extends BaseParser {

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

  parse() {
    const { stream } = this;
    const buffers = [];
    return new Promise((resolve, reject) => {
      stream.on('data', chunk => {
        buffers.push(chunk);
      });
      stream.on('end', () => {
        const buffer = Buffer.concat(buffers);
        const result = imageSize(buffer);
        resolve({
          image: result,
        });
      });
      stream.on('error', reject);
    });
  }
  
}
