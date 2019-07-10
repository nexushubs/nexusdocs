import * as pdfjs from 'pdfjs-dist';

import { staticImplements } from '../../../types/common';
import { IFileParser, IFileParserStatic } from '../types';
import BaseParser from '../BaseParser';

@staticImplements<IFileParserStatic>()
export default class PdfParser extends BaseParser implements IFileParser<'pdf'> {

  static key = 'pdf';
  static extensions = [
    'pdf',
  ];
  static needBuffer = true;

  async parse() {
    const { buffer } = this.input;
    const rawData = Uint8Array.from(buffer);
    const doc = await pdfjs.getDocument(rawData).promise;
    return {
      numPages: doc.numPages,
    };
  }
  
}
