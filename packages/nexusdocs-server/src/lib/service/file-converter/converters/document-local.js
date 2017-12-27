import _ from 'lodash';
import { spwan, spawn } from 'child_process';

import { ApiError } from '~/lib/errors';
import BaseConverter from '../base-converter';
import { PassThrough } from 'stream';

// Resize command pattern
// http://www.graphicsmagick.org/GraphicsMagick.html#details-resize
// format: <width>x<height>{%}{@}{!}{^}{<}{>}
const regexCommandThumbnail = /(\d+)?x(\d+)?([%@!^<>])?/;
const unoconvCommand = 'unoconv';

export default class DocumentConverter extends BaseConverter {

  static extensions = [
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
  ];

  static formats = [
    'pdf',
  ];

  static formatMap = {
  };

  static needFile = true;

  commands = [];
  
  prepare(command, options) {
    const method = `_${command}`;
    if (!this[method]) {
      throw new ApiError(400, null, 'DocumentConverter: invalid command');
    }
    const params = this[method](options);
    if (params) {
      this.commands.push(params);
    }
  }

  _format(format) {
    if (!this.constructor.formats.includes(format)) {
      throw new ApiError(400, null, 'DocumentConverter: unsupported format');
    }
    this.format = format;
    return ['--format', format];
  }

  preExec() {
    const { commands } = this;
    commands.push('--stdout');
    commands.push(this.filePath);
  }

  runCommands() {
    const { commands } = this;
    const args = [];
    commands.forEach(command => {
      if (_.isString(command)) {
        args.push(command);
      } else {
        command.forEach(arg => {
          args.push(arg);
        });
      }
    });
    console.log('DocumentConverter: ', unoconvCommand, args.join(' '));
    return spawn(unoconvCommand, args);
  }

  exec() {
    this.preExec();
    const errors = [];
    const stream = new PassThrough;
    const uno = this.runCommands();
    uno.stdout.pipe(stream);
    uno.stderr.on('data', chunk => errors.push(chunk));
    uno.on('exit', (code) => {
      if (code > 0 || errors.length) {
        stream.emit('error', Buffer.concat(errors));
      }
    });
    return stream;
  }
  
}
