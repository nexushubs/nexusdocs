import _ from 'lodash';
import sharp from 'sharp';
import { Readable } from 'stream';

import { ApiError } from 'lib/errors';
import BaseConverter from '../BaseConverter';
import { IFileConverter } from '../types';

// Resize command pattern
// http://www.graphicsmagick.org/GraphicsMagick.html#details-resize
// format: <width>x<height>{%}{@}{!}{^}{<}{>}
const regexCommandThumbnail = /(\d+)?x(\d+)?([%@!^<>])?/;

export default class ImageSharpConverter extends BaseConverter implements IFileConverter {

  public extensions = [
    'gif',
    'jpeg',
    'jpg',
    'png',
    'tiff',
    'svg',
    'webp',
  ];

  public formats = [
    'jpeg',
    'png',
    'webp',
    'tiff',
  ];

  public formatMap = {
    jpg: 'jpeg',
  };

  private quality: number;
  private commands: any[][] = [];

  addCommand(name: string = '', ...args: any[]) {
    this.commands.push([name, ...args])
  }

  prepare(command: string, options: string) {
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
    this.addCommand('resize', parseInt(width), parseInt(height));
    switch (method) {
      case '!':
        this.addCommand('ignoreAspectRatio');
        break;
      case '>':
        this.addCommand('withoutEnlargement');
        break;
      case '^':
        this.addCommand('min');
        break;
      case '%':
      case '@':
      case '<':
        throw new ApiError(400, null, 'ImageConverter.resize: geometry qualifiers is not supported')
      default:
        this.addCommand('max');
    }
  }

  _quality(quality: string) {
    const qualityValue = parseInt(quality);
    if (_.isNaN(qualityValue) || qualityValue <= 0 || qualityValue > 100) {
      throw new ApiError(400, null, 'ImageConverter.quality: invalid command option');
    }
    this.quality = qualityValue;
  }

  _format(format: string) {
    if (!this.formats.includes(format)) {
      throw new ApiError(400, null, 'ImageConverter: unsupported format');
    }
    this.format = format;
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
    const { commands } = this;
    return commands.reduce((result, command) => {
      if (_.isString(command)) {
        return result[command]();
      } else {
        const [ method, ...params ] = command;
        return result[method](...params);
      }
    }, handler);
  }

  preExec() {
    let formatCommand = _.find(this.commands, c => c[0] === 'toFormat');
    if (!formatCommand) {
      this.addCommand('toFormat', this.format);
    }
    if (this.quality) {
      if (!['jpeg', 'tiff', 'webp'].includes(this.format)) {
        throw new ApiError(400, null, 'ImageConverter: image format does not support quality');
      }
      const options = {
        quality: this.quality,
      }
      formatCommand.push(options);
    }
    let enlargeCommand = _.find(this.commands, c => c[0] === 'withoutEnlargement');
    if (!enlargeCommand) {
      this.addCommand('withoutEnlargement');
    }
  }

  async exec() {
    this.preExec();
    const handler = sharp()
    this.runCommands(handler);
    return this.stream.pipe(handler)
  }
  
}
