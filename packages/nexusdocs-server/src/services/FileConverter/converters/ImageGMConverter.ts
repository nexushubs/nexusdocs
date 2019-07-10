import * as _ from 'lodash';
import * as gm from 'gm';

import { staticImplements } from '../../../types/common';
import { ApiError } from '../../../lib/errors';
import { IFileConverter, TConvertingCommand, IFileConverterStatic } from '../types';
import BaseConverter from '../BaseConverter';

// Resize command pattern
// http://www.graphicsmagick.org/GraphicsMagick.html#details-resize
// format: <width>x<height>{%}{@}{!}{^}{<}{>}
const regexCommandThumbnail = /(\d+)?x(\d+)?([%@!^<>])?/

@staticImplements<IFileConverterStatic>()
export default class ImageGMConverter extends BaseConverter {

  static readonly inputFormats = [
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

  static readonly outputFormats = [
    'jpeg',
    'gif',
    'png',
  ];

  static readonly formatMap = {
    jpg: 'jpeg',
  };

  static readonly needBuffer = true;

  private commandList = [];

  prepare(command: string, options: TConvertingCommand) {
    const method = `_${command}`;
    if (!this[method]) {
      throw new ApiError(400, null, 'ImageConverter: invalid command');
    }
    const params = this[method](options);
    this.commandList.push(params);
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
    if (!ImageGMConverter.outputFormats.includes(format)) {
      throw new ApiError(400, null, 'ImageConverter: unsupported format');
    }
    this.output.format = format;
    return ['setFormat', format];
  }

  runCommands(handler) {
    const { commandList } = this;
    return commandList.reduce((result, command) => {
      const [ method, ...params ] = command;
      return result[method](...params);
    }, handler);
  }

  async exec() {
    const { stream, filename } = this.input;
    const handler = gm(stream, filename);
    const result = this.runCommands(handler);
    return result.stream();
  }
  
}
