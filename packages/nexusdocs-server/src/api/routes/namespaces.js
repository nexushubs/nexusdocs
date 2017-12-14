import _ from 'lodash';
import express from 'express';
import wrap from 'express-wrap-async';
import contentDisposition from 'content-disposition';
import mime from 'mime-types';

import { ApiError } from '~/lib/errors';
import { upload, checkAuth } from '~/api/middleware';
import { parseQueryStringHeaders } from '~/lib/util';
import { downloadFile } from './files';

const api = express.Router();

api.param('namespace', wrap(async (req, res, next) => {
  const { namespace } = req.params;
  const { Namespace } = req.model();
  const namespaceObj = await Namespace.get({ name: namespace });
  if (!namespaceObj) {
    throw new ApiError(404, null, 'Namespace not Found');
  }
  req.data.namespace = namespaceObj;
  next();
}));

api.get('/', checkAuth({ role: 'admin' }), wrap(async (req, res, next) => {
  const { Namespace } = req.model();
  const list = await Namespace.getAll();
  res.send(list);
}));

api.post('/', checkAuth({ role: 'admin' }), wrap(async (req, res, next) => {
  const { Namespace } = req.model();
  const data = req.body;
  await Namespace.create(data);
  res.send({});
}));

api.get('/:namespace', checkAuth({ role: 'admin' }), wrap(async (req, res, next) => {
  const { namespace } = req.data;
  res.send(namespace.data());
}));

api.put('/:namespace', checkAuth({ role: 'admin' }), wrap(async (req, res, next) => {
  const { namespace } = req.data;
  const data = req.body;
  await namespace.update(data);
  res.send({});
}));

api.delete('/:namespace', checkAuth({ role: 'admin' }), wrap(async (req, res, next) => {
  const { namespace } = req.data;
  await namespace.delete();
  res.send({});
}));

api.post('/:namespace/truncate', checkAuth(), wrap(async (req, res, next) => {
  const { namespace } = req.data;
  await namespace.truncate();
  res.send({});
}));

api.get('/:namespace/upload', checkAuth(), wrap(async (req, res, next) => {
  const { type } = req.query;
  if (type !== 'resumable') {
    throw new ApiError(400, null, 'GET method only for resumable upload');
  } else {
    const { resumable } = req.service();
    const status = await resumable.checkStatus(req.query);
    res.send(status.uploaded ? 200 : 404, { resumable: status });
  }
}));

api.post('/:namespace/upload', checkAuth({ from: 'url' }), upload(), wrap(async (req, res, next) => {
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
    'dateUploaded',
  ]);
  res.send({
    _id: file.files_id,
    ...data,
  });
}));

api.get('/:namespace/files', checkAuth(), wrap(async (req, res, next) => {
  const { File } = req.model();
  const { namespace } = req.params;
  const list = await File.getAll({namespace: namespace});
  res.send(list);
}));

api.param('files_id', wrap(async (req, res, next) => {
  const { files_id } = req.params;
  const fileObj = await req.model('file').get(files_id);
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

api.delete('/:namespace/files/:files_id', checkAuth(), wrap(async (req, res, next) => {
  const { namespace, file } = req.data;
  const { files_id } = req.params;
  await namespace.deleteFile(file);
  res.send({});
}));

api.post('/:namespace/archives', checkAuth(), wrap(async (req, res, next) => {
  const { files, filename } = req.body;
  const { namespace } = req.data;
  const archive = await namespace.createArchive(files, filename);
  res.send(archive.data());
}));

api.param('archive_id', wrap(async (req, res, next, archiveId) => {
  const { Archive } = req.model();
  const { archive_id } = req.params;
  const archive = await Archive.get(archive_id);
  if (!archive) {
    throw new ApiError(404, 'archive not found');
  }
  req.data.archive = archive;
  next();
}))

api.get('/:namespace/archives/:archive_id', checkAuth(), wrap(async (req, res, next) => {
  const { namespace, archive } = req.data;
  const { filename, store_id, size } = archive;
  const bucket = await namespace.bucket();
  const downloadStream = bucket.openDownloadStream(store_id);
  const contentType = mime.lookup(filename);
  res.set('Content-Type', contentType);
  res.set('Content-Disposition', contentDisposition(filename));
  res.set('Content-Length', size);
  downloadStream.pipe(res);
}));

export default api;
