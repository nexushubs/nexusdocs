import * as getStream from 'get-stream';
import BaseParser from '../BaseParser';
import { IFileParser } from '../types';

export default class TextParser extends BaseParser implements IFileParser {

  static key = 'text';
  static extensions = [
    'docx',
    'doc',
  ];
  static needBuffer = false;

  async parse() {
    const { filename, stream } = this;
    const { FileConverter } = this.services;
    const result = await FileConverter.convert(stream, filename, { format: 'txt' });
    const content = await getStream(result.stream);
    return { content };
  }
  
}
