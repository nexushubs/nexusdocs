import * as _ from 'lodash';
import { Response } from 'node-fetch';
import { PassThrough } from 'stream';
import * as contentDisposition from 'content-disposition';
import { IFileContent } from '../../types/file';
import { FileContent } from '../../lib/FileContent';
import { ApiError } from '../../cli/util';
import { IConvertingCommands } from './types';

export class Commands {

  static stringify(commands: IConvertingCommands): string {
    return '/' + _.flatten(_.toPairs(commands)).join('/');
  }

  static parse(commands: string): IConvertingCommands {
    return _.fromPairs(_.chunk(commands.split('/'), 2));
  }

}

export function getCacheKey(id: string, commands: IConvertingCommands) {
  return `${id}:/convert${Commands.stringify(commands)}`;
}

export function getContentType(ext: string) {

}

export async function fetchResponseToFileContent(response: Response, fileContent?: IFileContent): Promise<IFileContent> {
  if (response.status !== 200) {
    const error = await response.text();
    throw new ApiError(500, 'pandoc_api_error', error);
  }
  if (!fileContent) {
    fileContent = new FileContent();
  }
  const output = new PassThrough;
  const parsed = contentDisposition.parse(response.headers.get('content-disposition'));
  fileContent.stream = output;
  fileContent.filename = parsed.parameters.filename;
  fileContent.contentLength = parseInt(response.headers.get('content-length')) || undefined;
  fileContent.contentType = response.headers.get('content-type');
  response.body.pipe(output);
  return fileContent;
}
