import * as _ from 'lodash';
import * as gm from 'gm';

import { ApiError } from '../../../lib/errors';
import BaseConverter from '../BaseConverter';
import { IFileConverter, TConvertingOption } from '../types';

// Resize command pattern
// http://www.graphicsmagick.org/GraphicsMagick.html#details-resize
// format: <width>x<height>{%}{@}{!}{^}{<}{>}
const regexCommandThumbnail = /(\d+)?x(\d+)?([%@!^<>])?/

export default class ImageGMConverter extends BaseConverter implements IFileConverter {

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

  static formats = [
    'jpeg',
    'gif',
    'png',
  ];

  static formatMap = {
    jpg: 'jpeg',
  };

  static needBuffer = true;

  private commands = [];

  prepare(command: string, options: TConvertingOption) {
    const method = `_${command}`;
    if (!this[method]) {
      throw new ApiError(400, null, 'ImageConverter: invalid command');
    }
    const params = this[method](options);
    this.commands.push(params);
  }

  _resize(options: string) {
    const params = regexCommandThumbnail.exec(options);
    if (!params) {
      throw new ApiError(400, null, 'ImageConverter.resize: invalid command option');
    }
    params[0] = 'resize';
    return params;
  }

  _quality(q: string) {
    const quality = parseInt(q);
    if (_.isNaN(quality) || quality <= 0 || quality > 100) {
      throw new ApiError(400, null, 'ImageConverter.quality: invalid command option');
    }
    return ['quality', quality];
  }

  _format(format: string) {
    if (!ImageGMConverter.formats.includes(format)) {
      throw new ApiError(400, null, 'ImageConverter: unsupported format');
    }
    this.format = format;
    return ['setFormat', format];
  }

  runCommands(handler) {
    const { commands } = this;
    return commands.reduce((result, command) => {
      const [ method, ...params ] = command;
      return result[method](...params);
    }, handler);
  }

  async exec() {
    const handler = gm(this.stream, this.filename);
    const result = this.runCommands(handler);
    return result.stream();
  }
  
}
