import * as _ from 'lodash';
import * as mime from 'mime-types'
import * as request from 'request';
import * as contentDisposition from 'content-disposition';
import { PassThrough } from 'stream';

import { ApiError } from '../../../lib/errors';
import BaseConverter from '../BaseConverter';
import { IFileConverterStatic, IFileConverter, TConvertingCommand } from '../types';
import { staticImplements } from '../../../types/common';

@staticImplements<IFileConverterStatic>()
export default class DocumentConverter extends BaseConverter implements IFileConverter {

  static readonly inputFormats = [
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
  ];

  static readonly outputFormats = [
    'pdf',
    'txt',
  ];

  static readonly formatMap = {
  };

  private commandList = [];
  
  prepare(command: string, options: TConvertingCommand) {
    const method = `_${command}`;
    if (!this[method]) {
      throw new ApiError(400, null, 'DocumentConverter: invalid command');
    }
    const params = this[method](options);
    if (params) {
      this.commandList.push(params);
    }
  }

  _format(format: string) {
    if (!DocumentConverter.outputFormats.includes(format)) {
      throw new ApiError(400, null, 'DocumentConverter: unsupported format');
    }
    this.output.format = format;
    return ['format', format];
  }

  preExec() {
  }

  runCommands() {
    const { input, output, commandList, config } = this;
    const command = _.flatten(commandList).join('/');
    const url = `${config.unoconvServerURL}/convert/${command}`;
    const r = request({
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': mime.contentType(input.filename),
        'Content-Disposition': contentDisposition(output.filename),
      },
      body: input.stream,
    });
    return r;
  }

  async exec() {
    await this.preExec();
    const r = this.runCommands();
    const outputStream = new PassThrough;
    r.pipe(outputStream);
    this.output.stream = outputStream;
  }
  
}
