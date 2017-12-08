import _ from 'lodash';
import express from 'express';
import wrap from 'express-wrap-async';
import contentDisposition from 'content-disposition';

import { ApiError } from '~/lib/errors';
import { upload, checkAuth } from '~/api/middleware';
import { parseQueryStringHeaders } from '~/lib/util';

const api = express.Router();

api.use(checkAuth({
  role: 'admin',
}));

api.get('/', wrap(async (req, res, next) => {
  const { File } = req.model();
  const list = await File.getAll({});
  res.send(list);
}));

api.param('files_id', wrap(async (req, res, next) => {
  const { files_id } = req.params;
  const { File, Namespace } = req.model();
  const file = await File.get(files_id);
  if (!file) {
    throw new ApiError(404, null, 'File not Found');
  }
  req.data.file = file;
  const namespace = await Namespace.get({ name: file.data('namespace') });
  if (!namespace) {
    throw new ApiError(404, null, 'File not Found');
  }
  req.data.namespace = namespace;
  next();
}));

export const downloadFile = wrap(async (req, res, next) => {
  const { namespace, file } = req.data;
  const { files_id } = req.params;
  const { contentType, filename, size, store_id } = file.data();
  res.set('Content-Type', contentType);
  if (/download$/.test(req.path) || req.query.download) {
    res.set('Content-Disposition', contentDisposition(filename));
  }
  res.set('Content-Length', size);
  const headers = parseQueryStringHeaders(req);
  res.set(headers);
  const fileStream = await namespace.openDownloadStream(store_id);
  fileStream.pipe(res);
});

api.get([
  '/:files_id',
  '/:files_id/download',
], downloadFile);

export default api;
