import * as _ from 'lodash';
import * as mime from 'mime-types'
import fetch from 'node-fetch';
import * as contentDisposition from 'content-disposition';

import { ApiError } from '../../../lib/errors';
import BaseConverter from '../BaseConverter';
import { IFileConverterStatic, IFileConverter, TConvertingCommand } from '../types';
import { staticImplements, KeyValueMap } from '../../../types/common';
import { getExtension } from 'mime';
import { fetchResponseToFileContent, Commands } from '../utils';

const formatMap = {
  docx: 'docx',
  pptx: 'pptx',
  html: 'html',
  txt: 'plain',
  md: 'gfm',
}

const supportedExtensions = _.keys(formatMap);
const supportedFormat = _.keys(formatMap);

@staticImplements<IFileConverterStatic>()
export default class PandocConverter extends BaseConverter implements IFileConverter {

  static readonly inputFormats = supportedExtensions;

  static readonly outputFormats = supportedExtensions;

  static readonly formatMap = {
  };

  private commandMap: KeyValueMap<string> = {};
  
  prepare(key: string, value: TConvertingCommand) {
    const { commandMap } = this;
    console.log(key, '=', value);
    switch (key) {
      case 'format':
        if (!PandocConverter.inputFormats.includes(value + '')) {
          throw new ApiError(400, null, `PandocConverter: invalid format "${value}"`);
        }
        console.log(formatMap, formatMap[value]);
        commandMap.to = formatMap[value];
        break;
      case 'from':
        if (!supportedFormat.includes(value + '')) {
          throw new ApiError(400, null, `PandocConverter: unsupported input format "${value}"`);
        }
        commandMap.from = value + '';
        break;
      case 'to':
        if (!supportedFormat.includes(value + '')) {
          throw new ApiError(400, null, `PandocConverter: unsupported output format "${value}"`);
        }
        commandMap.to = value + '';
        break;
      default:
        throw new ApiError(400, null, `PandocConverter: invalid command "${key}"`);
    }
  }

  async runCommands() {
    const { input, output, commandMap, config } = this;
    if (!commandMap.from) {
      const extension = getExtension(input.contentType);
      const format = formatMap[extension];
      if (!format) {
        throw new ApiError(400, null, 'PandocConverter: invalid input file format');
      }
      this.prepare('from', format);
    }
    if (!commandMap.to) {
      throw new ApiError(400, null, 'PandocConverter: missing output format');
    }
    const command = Commands.stringify(commandMap);
    const url = `${config.pandocApiUrl}/convert${command}`;
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
