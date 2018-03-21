import _ from 'lodash';
import express from 'express';
import wrap from 'express-wrap-async';
import contentDisposition from 'content-disposition';
import mime from 'mime-types';
import boolean from 'boolean';

import { ApiError } from '~/lib/errors';
import { upload, checkAuth } from '~/api/middleware';
import { getExtension, parseQueryStringHeaders, getBasename, diffTimestampFromNow } from '~/lib/util';

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

// disable auth for GET APIs if namespace is public
const needAuth = auth => {
  const { namespace } = auth.req.data;
  return !namespace.isPublic;
};

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

api.get('/:namespace', checkAuth({ needAuth }), wrap(async (req, res, next) => {
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

api.post('/:namespace/urls', checkAuth(), wrap(async (req, res, next) => {
  const { File } = req.model();
  const { namespace } = req.data;
  const { e } = req.query;
  const { download, origin, expires: _expires, files: _files } = req.body;
  const fileIds = _.uniq(_files);
  const files = await File.getAll({_id: {$in: fileIds}});
  const expires = diffTimestampFromNow(expires || e);
  const data = await Promise.map(fileList, async file => {
    const { _id, contentType, filename, store_id } = file;
    const options = {
      contentType,
      expires,
      serverUrl: req.serverUrl,
    };
    if (download) {
      options.filename = filename;
    }
    const originalUrl = await namespace.getOriginalUrl(store_id, options);
    return {
      id: _id,
      url: originalUrl,
    };
  });
  res.send(data);
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

api.post('/:namespace/upload', checkAuth({ from: 'auto' }), upload(), wrap(async (req, res, next) => {
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
    'metadata',
  ]);
  console.log(`file ${file.files_id} uploaded!`);
  res.send({
    _id: file.files_id,
    ...data,
  });
}));

api.get('/:namespace/files', checkAuth({ role: 'admin' }), wrap(async (req, res, next) => {
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
], checkAuth({ needAuth }),
wrap(async (req, res, next) => {
  const { namespace, file } = req.data;
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
  res.set('Content-Length', size);
  if (download) {
    res.set('Content-Disposition', contentDisposition(filename));
  }
  const headers = parseQueryStringHeaders(req);
  res.set(headers);
  const fileStream = await namespace.openDownloadStream(store_id);
  fileStream.pipe(res);
}));

api.get('/:namespace/files/:files_id/original-url', checkAuth({ needAuth }), wrap(async (req, res, next) => {
  const { namespace, file } = req.data;
  const { download: _download } = req.query;
  const { contentType, filename, size } = file;
  const download = boolean(_download);
  const options = {
    download,
    expires: diffTimestampFromNow(e),
    serverUrl: req.serverUrl,
    processNative: true,
  };
  const originalUrl = await namespace.getOriginalUrl(file, options);
  const data = {
    url: originalUrl,
  };
  res.send(data);
}));

api.delete('/:namespace/files/:files_id', checkAuth(), wrap(async (req, res, next) => {
  const { namespace, file } = req.data;
  const { files_id } = req.params;
  await namespace.deleteFile(file);
  res.send({});
}));

api.get('/:namespace/files/:files_id/info', checkAuth({ needAuth }), wrap(async (req, res, next) => {
  const { file } = req.data;
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

api.get('/:namespace/files/:files_id/convert/:commands(*)', checkAuth({ needAuth }), wrap(async (req, res, next) => {
  const { FileCache } = req.service();
  const { namespace, file } = req.data;
  const { commands } = req.params;
  const download = boolean(req.query.download);
  const origin = boolean(req.query.origin);
  const bucket = await namespace.getBucket();
  const ext = getExtension(file.filename);
  if (origin && !bucket.isNative() && bucket.support(ext)) {
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

api.get('/:namespace/archive', checkAuth(), wrap(async (req, res, next) => {
  let { files, filename = `archive-${(new Date).toISOString()}` } = req.query;
  files = files.split(',');
  if (!/\.zip$/.test(filename)) {
    filename = `${filename}.zip`;
  }
  const { namespace } = req.data;
  const archiveStream = await namespace.createArchiveStream(files);
  const contentType = mime.lookup(filename);
  res.set('Content-Type', contentType);
  res.set('Content-Disposition', contentDisposition(filename));
  archiveStream.pipe(res);
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

api.get('/:namespace/archives/:archive_id', checkAuth({ needAuth }), wrap(async (req, res, next) => {
  const { namespace, archive } = req.data;
  const { filename, store_id, size } = archive;
  const bucket = await namespace.getBucket();
  const downloadStream = await bucket.openDownloadStream(store_id);
  const contentType = mime.lookup(filename);
  res.set('Content-Type', contentType);
  res.set('Content-Disposition', contentDisposition(filename));
  res.set('Content-Length', size);
  downloadStream.pipe(res);
}));

export default api;
