import * as _ from 'lodash';
import { spawn } from 'child_process';
import { PassThrough } from 'stream';

import { ApiError } from '../../../lib/errors';
import BaseConverter from '../BaseConverter';
import { IFileConverter } from '../types';

const unoconvCommand = 'unoconv';

/**
 * @deprecated 
 */
export default class DocumentLocalConverter extends BaseConverter implements IFileConverter {

  public extensions = [
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
  ];

  public formats = [
    'pdf',
  ];

  public formatMap = {
  };

  public needFile = true;

  private commands: (string[] | string)[] = [];
  
  prepare(command: string, options: string) {
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
    if (!(<any>this.constructor).formats.includes(format)) {
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

  async exec() {
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
