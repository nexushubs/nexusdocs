import { Request, Response } from 'express';
import * as contentDisposition from 'content-disposition';
import { IFileContent } from '../types/file';
import { parseQueryStringHeaders } from '../lib/util';

export interface FileContentOptions {
  download?: boolean;
}

export function writeFileContent(req: Request, res: Response, content: IFileContent, options: FileContentOptions = {}) {
  const { download } = options;
  res.set('Content-Type', content.contentType);
  const headers = parseQueryStringHeaders(req);
  if (download) {
    headers.set('Content-Disposition', contentDisposition(content.filename));
  }
  if (content.contentLength) {
    headers.set('Content-Length', content.contentLength + '');
  }
  res.set(headers.raw());
  res.flushHeaders();
  content.stream.pipe(res);
}
