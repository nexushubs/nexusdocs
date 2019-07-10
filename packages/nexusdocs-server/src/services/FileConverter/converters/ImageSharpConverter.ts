import * as _ from 'lodash';
import * as sharp from 'sharp';

import { staticImplements } from '../../../types/common';
import { ApiError } from '../../../lib/errors';
import { IFileConverterStatic, IFileConverter, TConvertingCommand } from '../types';
import BaseConverter from '../BaseConverter';
import getStream = require('get-stream');

// Resize command pattern
// http://www.graphicsmagick.org/GraphicsMagick.html#details-resize
// format: <width>x<height>{%}{@}{!}{^}{<}{>}
const regexCommandThumbnail = /(\d+)?x(\d+)?([%@!^<>])?/;

@staticImplements<IFileConverterStatic>()
export default class ImageSharpConverter extends BaseConverter implements IFileConverter {

  static readonly inputFormats = [
    'gif',
    'jpeg',
    'jpg',
    'png',
    'tiff',
    'svg',
    'webp',
  ];

  static readonly outputFormats = [
    'jpeg',
    'png',
    'webp',
    'tiff',
  ];

  static readonly formatMap = {
    jpg: 'jpeg',
  };

  private quality: number;
  private commandList: any[][] = [];

  addCommand(name: string = '', ...args: any[]) {
    this.commandList.push([name, ...args])
  }

  prepare(command: string, options: TConvertingCommand) {
    const method = `_${command}`;
    if (!this[method]) {
      throw new ApiError(400, null, 'ImageConverter: invalid command');
    }
    this[method](options);
  }

  _resize(options: string) {
    const params = regexCommandThumbnail.exec(options);
    if (!params) {
      throw new ApiError(400, null, 'ImageConverter.resize: invalid command option');
    }
    const [, width, height, method] = params;
    const opt: sharp.ResizeOptions = {};
    switch (method) {
      case '!':
        opt.fit = 'fill';
        break;
      case '>':
        opt.withoutEnlargement = true;
        break;
      case '^':
        opt.fit = 'outside';
        break;
      case '%':
      case '@':
      case '<':
        throw new ApiError(400, null, 'ImageConverter.resize: geometry qualifiers is not supported')
      default:
    }
    if (!opt.fit) {
      opt.fit = 'inside';
    }
    this.addCommand('resize', parseInt(width), parseInt(height), opt);
  }

  _quality(quality: string) {
    const qualityValue = parseInt(quality);
    if (_.isNaN(qualityValue) || qualityValue <= 0 || qualityValue > 100) {
      throw new ApiError(400, null, 'ImageConverter.quality: invalid command option');
    }
    this.quality = qualityValue;
  }

  _format(format: string) {
    if (!ImageSharpConverter.outputFormats.includes(format)) {
      throw new ApiError(400, null, 'ImageConverter: unsupported format');
    }
    this.output.format = format;
    this.addCommand('toFormat', format);
  }

  _rotate(angle: string) {
    let angleValue: number
    if (angle === 'auto') {
      angleValue = undefined;
    } else {
      angleValue = parseInt(angle);
      if (!_.isNaN(angleValue) || angleValue % 90 !== 0) {
        throw new ApiError(400, null, 'ImageConverter: invalid rotate angle');
      }
    }
    this.addCommand('rotate', angleValue);
  }

  runCommands(handler: sharp.Sharp) {
    const { commandList } = this;
    return commandList.reduce((result, command) => {
      if (_.isString(command)) {
        return result[command]();
      } else {
        const [ method, ...params ] = command;
        return result[method](...params);
      }
    }, handler);
  }

  preExec() {
    let formatCommand = _.find(this.commandList, c => c[0] === 'toFormat');
    if (!formatCommand) {
      this.addCommand('toFormat', this.input.format);
    }
    if (this.quality) {
      if (!['jpeg', 'tiff', 'webp'].includes(this.output.format)) {
        throw new ApiError(400, null, 'ImageConverter: image format does not support quality');
      }
      const options = {
        quality: this.quality,
      }
      formatCommand.push(options);
    }
  }

  async exec() {
    const { input, output } = this;
    this.preExec();
    const handler = sharp();
    this.runCommands(handler);
    input.stream.pipe(handler);
    output.stream = handler;
  }
  
}
