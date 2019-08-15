import * as _ from 'lodash';
import * as mime from 'mime-types'
import fetch from 'node-fetch';
import * as contentDisposition from 'content-disposition';

import { ApiError } from '../../../lib/errors';
import { staticImplements, KeyValueMap } from '../../../types/common';
import BaseConverter from '../BaseConverter';
import { IFileConverterStatic, IFileConverter, TConvertingCommand } from '../types';
import { fetchResponseToFileContent, Commands } from '../utils';

@staticImplements<IFileConverterStatic>()
export default class UnoconvConverter extends BaseConverter implements IFileConverter {

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
    'docx',
  ];

  static readonly formatMap = {
  };

  private commandMap: KeyValueMap<string>;
  
  prepare(key: string, value: TConvertingCommand) {
    const { commandMap } = this;
    switch (key) {
      case 'format':
        if (!UnoconvConverter.outputFormats.includes(value + '')) {
          throw new ApiError(400, null, 'UnoconvConverter: unsupported format');
        }
        this.output.format = value + '';
        commandMap.format = value + '';
        break;
      default:
        throw new ApiError(400, null, 'UnoconvConverter: invalid command');
    }
  }

  async runCommands() {
    const { input, output, commandMap, config } = this;
    if (!commandMap.format) {
      throw new ApiError(400, null, 'UnoconvConverter: missing output format');
    }
    const command = Commands.stringify(commandMap);
    const url = `${config.unoconvServerUrl}/convert${command}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': input.contentType || mime.contentType(input.filename) || 'application/octet-stream',
        'Content-Disposition': contentDisposition(output.filename),
      },
      body: input.stream,
    });
    if (response.status !== 200) {
      const text = await response.text();
      throw new ApiError(500, 'converting_error', text);
    }
    return response;
  }

  async exec() {
    const response = await this.runCommands();
    fetchResponseToFileContent(response, this.output);
  }
  
}
