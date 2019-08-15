
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';
import * as mime from 'mime-types';
import * as contentDisposition from 'content-disposition';
import { RequestHandler, Request } from 'express';

import { ApiError } from '../../cli/util';
import getStream = require('get-stream');
import { wrap } from 'async-middleware';
import { Readable } from 'stream';

export interface UploadRawOptions {
  stream?: boolean;
  buffer?: boolean;
}

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        location: string;
        filename: string;
        path: string;
        buffer: Buffer | null;
        stream: Readable | null;
      }
    }
  }
}

export function uploadRaw(options: UploadRawOptions = {}): RequestHandler {
  return wrap(async (req, res, next) => {
    let contentType: string | null = req.get('Content-Type');
    const contentDisp = req.get('Content-Disposition');
    if (contentType.indexOf('multipart/form-data') === 0) {
      next();
      return;
    }
    if (!contentType && !contentDisp) {
      throw new ApiError(400, 'invalid_header', 'Could not find Content-Type or Content-Disposition header');
    }
    let filename: string = '';
    if (contentDisp && !filename) {
      const parsed = contentDisposition.parse(contentDisp);
      if (!parsed || !parsed.parameters || !parsed.parameters.filename) {
        throw new ApiError(400, 'invalid_header', 'invalid Content-Disposition header');
      }
      filename = parsed.parameters.filename;
      if (!contentType) {
        contentType = mime.contentType(filename) || null;
      }
    }
    if (!contentType) {
      contentType = 'application/octet-stream';
    }
    const ext = path.extname(filename);
    if (options.buffer) {
      req.file = {
        originalname: filename,
        filename: filename,
        path: null,
        fieldname: 'file',
        size: 0,
        encoding: 'binary',
        mimetype: contentType,
        destination: null,
        location: null,
        buffer: await getStream.buffer(req),
        stream: null,
      }
    } else if (options.stream) {
      req.file = {
        originalname: filename,
        filename: filename,
        path: null,
        fieldname: 'file',
        size: 0,
        encoding: 'binary',
        mimetype: contentType,
        destination: null,
        location: null,
        buffer: null,
        stream: req,
      }
    } else {
      const newFilename = `${uuid.v4()}${ext}`;
      const filePath = `${os.tmpdir()}/${newFilename}`;
      const fileStream = fs.createWriteStream(filePath);
      fileStream.on('finish', () => {
        req.file = {
          originalname: filename,
          filename: newFilename,
          path: filePath,
          fieldname: 'file',
          size: 0,
          encoding: null,
          mimetype: contentType,
          destination: null,
          location: null,
          buffer: null,
          stream: null,
        };
        next();
      });
      req.pipe(fileStream);
    }
  });
};
