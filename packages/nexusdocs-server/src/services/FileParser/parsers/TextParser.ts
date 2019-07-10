import * as getStream from 'get-stream';

import { staticImplements } from '../../../types/common';
import { IFileParser, IFileParserStatic } from '../types';
import BaseParser from '../BaseParser';

@staticImplements<IFileParserStatic>()
export default class TextParser extends BaseParser implements IFileParser<'text'> {

  static key = 'text';
  static extensions = [
    'docx',
    'doc',
  ];
  static needBuffer = false;

  async parse() {
    const { filename, stream } = this.input;
    const { FileConverter } = this.services;
    const result = await FileConverter.convert({ stream, filename }, { format: 'txt' });
    const content = await getStream(result.stream);
    return { content };
  }
  
}
