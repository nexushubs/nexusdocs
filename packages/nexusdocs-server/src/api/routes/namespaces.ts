import * as _ from 'lodash';
import { Router } from 'express';
import { wrap } from 'async-middleware';
import * as contentDisposition from 'content-disposition';
import * as mime from 'mime-types';
import * as boolean from 'boolean';

import { app } from '../../lib/Application';
import { ApiError } from '../../lib/errors';
import { getExtension, parseQueryStringHeaders, getBasename, diffTimestampFromNow } from '../../lib/util';
import { upload, checkAuth } from '../middleware';
import { UserRole, AuthFrom, Authorization } from '../middleware/check-auth';
import { IRequest, IResponse, ILocals, AttachedResponse } from '../types';
import { Namespace, Archive, File } from '../../models';

interface Req extends IRequest {
}

interface Locals extends ILocals {
  namespace?: Namespace;
  archive?: Archive;
  file?: File;
}

interface Res extends AttachedResponse<Locals> {}

const api = Router();

api.param('namespace', wrap<Req, Res>(async (req, res, next) => {
  const { namespace } = req.params;
  const { Namespace } = app().models;
  const namespaceObj = await Namespace.get({ name: namespace });
  if (!namespaceObj) {
    throw new ApiError(404, null, 'Namespace not Found');
  }
  res.locals.namespace = namespaceObj;
  req.res.locals.namespace = namespaceObj;
  next();
}));

// disable auth for GET APIs if namespace is public
const needAuth = (auth: Authorization) => {
  const { namespace } = auth.res.locals;
  return !namespace.isPublic;
};

api.get('/', checkAuth({ role: UserRole.Admin }), wrap<Req, Res>(async (req, res, next) => {
  const { Namespace } = app().models;
  const list = await Namespace.getAll();
  res.send(list);
}));

api.post('/', checkAuth({ role: UserRole.Admin }), wrap<Req, Res>(async (req, res, next) => {
  const { Namespace } = app().models;
  const data = req.body;
  await Namespace.create(data);
  res.send({});
}));

api.get('/:namespace', checkAuth({ needAuth }), wrap<Req, Res>(async (req, res, next) => {
  const { namespace } = res.locals;
  res.send(namespace.data());
}));

api.put('/:namespace', checkAuth({ role: UserRole.Admin }), wrap<Req, Res>(async (req, res, next) => {
  const { namespace } = res.locals;
  const data = req.body;
  await namespace.update(data);
  res.send({});
}));

api.delete('/:namespace', checkAuth({ role: UserRole.Admin }), wrap<Req, Res>(async (req, res, next) => {
  const { namespace } = res.locals;
  await namespace.delete();
  res.send({});
}));

api.post('/:namespace/urls', checkAuth(), wrap<Req, Res>(async (req, res, next) => {
  const { File } = app().models;
  const { namespace } = res.locals;
  const { e } = req.query;
  const { download, origin, expires: _expires, files: _files } = req.body;
  const fileIds = _.uniq(_files);
  const fileList = await File.getAll({_id: {$in: fileIds}});
  const expires = diffTimestampFromNow(_expires || e);
  const data = await Promise.all(fileList.map(async file => {
    const { _id, contentType, filename, store_id } = file;
    const options = {
      contentType,
      filename: null,
      expires,
      serverUrl: res.locals.serverUrl,
    };
    if (download) {
      options.filename = filename;
    }
    const originalUrl = await namespace.getOriginalUrl(file, options);
    return {
      id: _id,
      url: originalUrl,
    };
  }));
  res.send(data);
}));

api.post('/:namespace/truncate', checkAuth(), wrap<Req, Res>(async (req, res, next) => {
  const { namespace } = res.locals;
  await namespace.truncate();
  res.send({});
}));

api.get('/:namespace/upload', checkAuth(), wrap<Req, Res>(async (req, res, next) => {
  const { type } = req.query;
  if (type !== 'resumable') {
    throw new ApiError(400, null, 'GET method only for resumable upload');
  } else {
    const { Resumable } = app().services;
    const status = await Resumable.checkStatus(req.query);
    res.status(status ? 200 : 404).send({ resumable: status });
  }
}));

api.post('/:namespace/upload', checkAuth({ from: AuthFrom.Auto }), upload(), wrap<Req, Res>(async (req, res, next) => {
  const { file } = <any>req;
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
    'metadata',
  ]);
  console.log(`file ${file.files_id} uploaded!`);
  res.send({
    _id: file.files_id,
    ...data,
  });
}));

api.get('/:namespace/files', checkAuth({ role: UserRole.Admin }), wrap<Req, Res>(async (req, res, next) => {
  const { File } = app().models;
  const { namespace } = req.params;
  const list = await File.getAll({namespace: namespace});
  res.send(list);
}));

api.param('files_id', wrap<Req, Res>(async (req, res, next) => {
  const { File } = app().models;
  const { files_id } = req.params;
  const fileObj = await File.get(files_id);
  if (!fileObj) {
    throw new ApiError(404, null, 'File not Found');
  }
  res.locals.file = fileObj;
  next();
}));

api.get([
  '/:namespace/files/:files_id',
  '/:namespace/files/:files_id/download',
], checkAuth({ needAuth }),
wrap<Req, Res>(async (req, res, next) => {
  const { namespace, file } = res.locals;
  const { download: _download, origin: _origin, e } = req.query;
  const { contentType, filename, size, store_id } = file;
  const download = (/download$/.test(req.path) || boolean(_download));
  const origin = boolean(_origin);
  if (origin) {
    const options = {
      download,
      expires: diffTimestampFromNow(e),
    };
    const originalUrl = await namespace.getOriginalUrl(file, options);
    if (originalUrl) {
      res.redirect(originalUrl);
      return;
    }
  }
  res.set('Content-Type', contentType);
  res.set('Content-Length', size + '');
  if (download) {
    res.set('Content-Disposition', contentDisposition(filename));
  }
  const headers = parseQueryStringHeaders(req);
  res.set(headers);
  const fileStream = await namespace.openDownloadStream(store_id);
  fileStream.pipe(res);
}));

api.get('/:namespace/files/:files_id/original-url', checkAuth({ needAuth }), wrap<Req, Res>(async (req, res, next) => {
  const { namespace, file } = res.locals;
  const { download: _download, e } = req.query;
  const { contentType, filename, size } = file;
  const download = boolean(_download);
  const options = {
    download,
    expires: diffTimestampFromNow(parseInt(e)),
    serverUrl: res.locals.serverUrl,
    processNative: true,
  };
  const originalUrl = await namespace.getOriginalUrl(file, options);
  const data = {
    url: originalUrl,
  };
  res.send(data);
}));

api.delete('/:namespace/files/:files_id', checkAuth(), wrap<Req, Res>(async (req, res, next) => {
  const { namespace, file } = res.locals;
  const { files_id } = req.params;
  await namespace.deleteFile(file);
  res.send({});
}));

api.get('/:namespace/files/:files_id/info', checkAuth({ needAuth }), wrap<Req, Res>(async (req, res, next) => {
  const { file } = res.locals;
  const store = await file.getStore();
  const data = {
    _id: file._id,
    ..._.omit(store.data(), [
      '_id',
      'files_id',
      'status',
    ]),
  };
  res.send(data);
}));

api.get('/:namespace/files/:files_id/convert/:commands(*)', checkAuth({ needAuth }), wrap<Req, Res>(async (req, res, next) => {
  const { FileCache } = app().services;
  const { namespace, file } = res.locals;
  const { commands } = req.params;
  const download = boolean(req.query.download);
  const origin = boolean(req.query.origin);
  const bucket = await namespace.getBucket();
  const ext = getExtension(file.filename);
  if (origin && !bucket.isNative() && bucket.isConvertingSupported(ext)) {
    const url = await bucket.getConvertedUrl(file.store_id, { inputType: ext, commands });
    res.redirect(url);
  } else {
    const cacheBuilder = () => namespace.convert(file, commands);
    const cacheKey = `convert:${namespace.name}:${file.store_id}:${commands}`;
    FileCache.get(cacheKey, cacheBuilder)
    .then((cacheObject) => {
      if (!cacheObject) {
        throw new ApiError(500, null, 'Converting failed');
      }
      const { contentType, stream } = cacheObject;
      res.set('Content-Type', contentType);
      const headers = parseQueryStringHeaders(req);
      if (download) {
        const filename = `${getBasename(file.filename)}.${mime.extension(contentType)}`;
        headers['Content-Disposition'] = contentDisposition(filename);
      }
      res.set(headers);
      stream.pipe(res);
    })
    .catch(next);
  }
}));

api.get('/:namespace/archive', checkAuth(), wrap<Req, Res>(async (req, res, next) => {
  let { files, filename = `archive-${(new Date).toISOString()}` } = req.query;
  files = files.split(',');
  if (!/\.zip$/.test(filename)) {
    filename = `${filename}.zip`;
  }
  const { namespace } = res.locals;
  const archiveStream = await namespace.createArchiveStream(files);
  const contentType = mime.lookup(filename) || 'application/zip';
  res.set('Content-Type', contentType);
  res.set('Content-Disposition', contentDisposition(filename));
  archiveStream.pipe(res);
}));

api.post('/:namespace/archives', checkAuth(), wrap<Req, Res>(async (req, res, next) => {
  const { files, filename } = req.body;
  const { namespace } = res.locals;
  const archive = await namespace.createArchive(files, filename);
  res.send(archive.data());
}));

api.param('archive_id', wrap<Req, Res>(async (req, res, next) => {
  const { Archive } = app().models;
  const { archive_id } = req.params;
  const archive = await Archive.get(archive_id);
  if (!archive) {
    throw new ApiError(404, 'archive not found');
  }
  res.locals.archive = archive;
  next();
}))

api.get('/:namespace/archives/:archive_id', checkAuth({ needAuth }), wrap<Req, Res>(async (req, res, next) => {
  const { namespace, archive } = res.locals;
  const { filename, store_id, size } = archive;
  const bucket = await namespace.getBucket();
  const downloadStream = await bucket.openDownloadStream(store_id);
  const contentType = mime.lookup(filename) || 'application/zip';
  res.set('Content-Type', contentType);
  res.set('Content-Disposition', contentDisposition(filename));
  res.set('Content-Length', size + '');
  downloadStream.pipe(res);
}));

api.get('/:namespace/search/similar-doc', checkAuth({ needAuth }), wrap<Req, Res>(async (req, res, next) => {
  const { namespace } = res.locals;
  const { id } = req.query;
  const result = await namespace.searchSimilarDoc({ id });
  res.send(result);
}));

api.post('/:namespace/search/similar-doc', checkAuth({ needAuth }), wrap<Req, Res>(async (req, res, next) => {
  const { namespace } = res.locals;
  const result = await namespace.searchSimilarDoc(req.body);
  res.send(result);
}));

api.get('/:namespace/stats', checkAuth({ needAuth }), wrap<Req, Res>(async (req, res, next) => {
  const { namespace } = res.locals;
  const result = await namespace.getStats();
  res.send(result);
}));

export default api;
