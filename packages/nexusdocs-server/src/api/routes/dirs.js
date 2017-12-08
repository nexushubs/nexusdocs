import _ from 'lodash';
import express from 'express';
import wrap from 'express-wrap-async';

import { ApiError } from '~/lib/errors';

const api = express();

api.param('namespaces_id', wrap(async (req, res, next) => {
  const { Namespace } = req.model();
  const { namespaces_id } = req.params;
  const doc = await Namespace.get(path);
  if (!doc) {
    throw new ApiError(404, 'Namespace not Found');
  }
  req.data.namespace = namespace;
  next();
}));

api.param('path', wrap(async (req, res, next) => {
  const { Dir } = req.model();
  const { path } = req.params;
  const doc = await Dir.get(path);
  if (!doc) {
    throw new ApiError(404, 'Dir not Found');
  }
  req.data.Dir = doc;
  next();
}));

api.get('/:namespaces_id', wrap(async (req, res, next) => {
  const { Dir } = req.model();
  const list = await Dir.getAll();
  res.send(list);
}));

api.post('/:namespaces_id', wrap(async (req, res, next) => {
  const { Dir } = req.model();
  const data = req.body;
  await Dir.create(data);
  res.send({});
}));

api.get('/:namespaces_id/:path', wrap(async (req, res, next) => {
  res.send(req.data.doc);
}));

api.put('/:namespaces_id/:path', wrap(async (req, res, next) => {
  const { Dir } = req.model();
  const { path } = req.params;
  const data = req.body;
  await Dir.update(path, data);
  res.send({});
}));

api.delete('/:namespaces_id/:path', wrap(async (req, res, next) => {
  const { Dir } = req.model();
  const { path } = req.params;
  await Dir.delete(path);
  res.send({});
}));

export default api;
