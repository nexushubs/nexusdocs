import _ from 'lodash';
import sharp from 'sharp';

import { ApiError } from '~/lib/errors';
import BaseConverter from '../base-converter';

// Resize command pattern
// http://www.graphicsmagick.org/GraphicsMagick.html#details-resize
// format: <width>x<height>{%}{@}{!}{^}{<}{>}
const regexCommandThumbnail = /(\d+)?x(\d+)?([%@!^<>])?/;

export default class ImageSharpConverter extends BaseConverter {

  static extensions = [
    'gif',
    'jpeg',
    'jpg',
    'png',
    'tiff',
    'svg',
    'webp',
  ];

  static formats = [
    'jpeg',
    'png',
    'webp',
    'tiff',
  ];

  static formatMap = {
    jpg: 'jpeg',
  };

  commands = [];

  prepare(command, options) {
    const method = `_${command}`;
    if (!this[method]) {
      throw ApiError(400, null, 'ImageConverter: invalid command');
    }
    const params = this[method](options);
    if (params) {
      this.commands.push(params);
    }
  }

  _resize(options) {
    const { commands } = this;
    const params = regexCommandThumbnail.exec(options);
    if (!params) {
      throw new ApiError(400, null, 'ImageConverter.resize: invalid command option');
    }
    let [ undefined, width, height, method ] = params;
    if (!_.isUndefined(width)) {
      width = parseInt(width);
    }
    if (!_.isUndefined(height)) {
      height = parseInt(height);
    }
    commands.push(['resize', width, height]);
    switch (method) {
      case '!':
        commands.push('ignoreAspectRatio');
        break;
      case '>':
        commands.push('withoutEnlargement');
        break;
      case '^':
        commands.push('min');
        break;
      case '%':
      case '@':
      case '<':
        throw new ApiError(400, null, 'ImageConverter.resize: geometry qualifiers is not supported')
      default:
        commands.push('max');
    }
  }

  _quality(quality) {
    const { commands } = this;
    quality = parseInt(quality);
    if (_.isNaN(quality) || quality <= 0 || quality > 100) {
      throw new ApiError(400, null, 'ImageConverter.quality: invalid command option');
    }
    this.quality = quality;
  }

  _format(format) {
    if (!this.constructor.formats.includes(format)) {
      throw new ApiError(400, null, 'ImageConverter: unsupported format');
    }
    this.format = format;
    return ['toFormat', format];
  }

  _rotate(angle) {
    const { commands } = this;
    if (angle === 'auto') {
      angle = undefined;
    } else {
      angle = parseInt(angle);
      if (!_.isNaN(angle) || angle % 90 !== 0) {
        throw new ApiError(400, null, 'ImageConverter: invalide rotate angle');
      }
    }
    commands.push(['rotate', angle]);
  }

  runCommands(handler) {
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
    const { commands } = this;
    let formatCommand = _.find(commands, c => c[0] === 'toFormat');
    if (!formatCommand) {
      formatCommand = ['toFormat', this.format];
      commands.push(formatCommand);
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
    let enlargeCommand = _.find(commands, c => c[0] === 'withoutEnlargement');
    if (!enlargeCommand) {
      commands.push('withoutEnlargement');
    }
  }

  exec() {
    this.preExec();
    const handler = sharp()
    const result = this.runCommands(handler);
    return this.stream.pipe(handler)
  }
  
}
