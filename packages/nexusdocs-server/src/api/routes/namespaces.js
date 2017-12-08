import _ from 'lodash';
import express from 'express';
import wrap from 'express-wrap-async';
import contentDisposition from 'content-disposition';

import { ApiError } from '~/lib/errors';
import { upload, checkAuth } from '~/api/middleware';
import { parseQueryStringHeaders } from '~/lib/util';
import { downloadFile } from './files';

const api = express.Router();

api.use(checkAuth({
  role: 'admin',
}));

api.param('namespace', wrap(async (req, res, next) => {
  const { namespace } = req.params;
  const namespaceObj = await req.model('namespace').get({name: namespace});
  if (!namespaceObj) {
    throw new ApiError(404, null, 'Namespace not Found');
  }
  req.data.namespace = namespaceObj;
  next();
}));

api.get('/', wrap(async (req, res, next) => {
  const { Namespace } = req.model();
  const list = await Namespace.getAll();
  res.send(list);
}));

api.post('/', wrap(async (req, res, next) => {
  const { Namespace } = req.model();
  const data = req.body;
  await Namespace.create(data);
  res.send({});
}));

api.get('/:namespace', wrap(async (req, res, next) => {
  const { namespace } = req.data;
  res.send(namespace.data());
}));

api.put('/:namespace', wrap(async (req, res, next) => {
  const { namespace } = req.data;
  const data = req.body;
  await namespace.update(data);
  res.send({});
}));

api.delete('/:namespace', wrap(async (req, res, next) => {
  const { namespace } = req.data;
  await namespace.delete();
  res.send({});
}));

api.post('/:namespace/truncate', wrap(async (req, res, next) => {
  const { namespace } = req.data;
  await namespace.truncate();
  res.send({});
}));

api.get('/:namespace/upload', wrap(async (req, res, next) => {
  const { type } = req.query;
  if (type !== 'resumable') {
    throw new ApiError(400, null, 'GET method only for resumable upload');
  } else {
    const { resumable } = req.service();
    const status = await resumable.checkStatus(req.query);
    res.send(status.uploaded ? 200 : 404, { resumable: status });
  }
}));

api.post('/:namespace/upload', upload(), wrap(async (req, res, next) => {
  const { file } = req;
  if (!file) {
    throw new ApiError(400, 'Missing file data');
  }
  const data = _.pick(file, [
    'resumable',
    'filename',
    'contentType',
    'md5',
    'size',
    'status',
    'uploadDate',
  ]);
  res.send({
    _id: file.files_id,
    ...data,
  });
}));

api.get('/:namespace/files', wrap(async (req, res, next) => {
  const { File } = req.model();
  const { namespace } = req.params;
  const list = await File.getAll({namespace: namespace});
  res.send(list);
}));

api.param('files_id', wrap(async (req, res, next) => {
  const { files_id } = req.params;
  const fileObj = await req.model('file').get(files_id);
  console.log(files_id);
  if (!fileObj) {
    throw new ApiError(404, null, 'File not Found');
  }
  req.data.file = fileObj;
  next();
}));

api.get([
  '/:namespace/files/:files_id',
  '/:namespace/files/:files_id/download',
], checkAuth(), downloadFile);

api.delete('/:namespace/files/:files_id', wrap(async (req, res, next) => {
  const { namespace, file } = req.data;
  const { files_id } = req.params;
  await namespace.deleteFile(file);
  res.send({});
}));

export default api;
