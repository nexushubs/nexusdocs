import * as _ from 'lodash';
import { Router } from 'express';
import { wrap } from 'async-middleware';
import * as contentDisposition from 'content-disposition';
import * as boolean from 'boolean';
import { createReadStream } from 'fs';

import { IFileContent } from '../../types/file';
import { ApiError } from '../../lib/errors';
import { IRequest, IResponse, ILocals, AttachedResponse } from '../types';
import { checkAuth, upload } from '../middleware';
import { writeFileContent } from '../utils';

const api = Router();

interface Req extends IRequest {
}

interface Locals extends ILocals {
}

interface Res extends AttachedResponse<Locals> {
}

api.use(checkAuth());

api.post('/:commands(*)', upload('raw'), upload('simple'), wrap<Req, Res>(async (req, res, next) => {
  const { FileConverter } = req.context.services;
  const { commands } = req.params;
  const { file } = req;
  if (!file) {
    throw new ApiError(400, 'missing file');
  }
  const download = boolean(req.query.download);
  const fileContent: IFileContent = {
    stream: createReadStream(file.path),
    contentType: file.mimetype,
    filename: file.originalname,
  }
  const result = await FileConverter.convert(fileContent, commands);
  writeFileContent(req, res, result, { download });
}));

export default api;
