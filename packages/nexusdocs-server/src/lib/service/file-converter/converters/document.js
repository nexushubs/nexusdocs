import _ from 'lodash';
import mime from 'mime-types';
import fs from 'fs';
import request from 'request';
import contentDisposition from 'content-disposition';
import { PassThrough } from 'stream';

import { ApiError } from '~/lib/errors';
import BaseConverter from '../base-converter';

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
    return ['format', format];
  }

  preExec() {
  }

  runCommands() {
    const { stream, filename, commands } = this;
    const command = _.flatten(commands).join('/');
    const url = `${this.options.uniconvServerURL}/convert/${command}`;
    const r = request({
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': mime.contentType(this.filename),
        'Content-Disposition': contentDisposition(filename),
      },
      body: stream,
    });
    return r;
  }

  async exec() {
    const { stream } = this;
    await this.preExec();
    const r = this.runCommands();
    // pipe to skip original HTTP header
    const output = new PassThrough;
    r.pipe(output);
    return output;
  }
  
}
