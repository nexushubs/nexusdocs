import _ from 'lodash';
import { Router } from 'express';
import { wrap } from 'async-middleware';

import { app } from 'lib/Application';
import { ApiError } from 'lib/errors';
import { checkAuth } from 'api/middleware';
import { UserRole } from 'api/middleware/check-auth';

const api = Router();

api.use(checkAuth({
  role: UserRole.Admin,
}));

api.param('namespaces_id', wrap(async (req, res, next) => {
  const { Namespace } = app().models;
  const { namespaces_id } = req.params;
  const doc = await Namespace.get(namespaces_id);
  if (!doc) {
    throw new ApiError(404, 'Namespace not Found');
  }
  res.locals.namespace = doc;
  next();
}));

api.param('path', wrap(async (req, res, next) => {
  const { Dir } = app().models;
  const { path } = req.params;
  const doc = await Dir.get(path);
  if (!doc) {
    throw new ApiError(404, 'Dir not Found');
  }
  res.locals.Dir = doc;
  next();
}));

api.get('/:namespaces_id', wrap(async (req, res, next) => {
  const { Dir } = app().models;
  const list = await Dir.getAll();
  res.send(list);
}));

api.post('/:namespaces_id', wrap(async (req, res, next) => {
  const { Dir } = app().models;
  const data = req.body;
  await Dir.create(data);
  res.send({});
}));

api.get('/:namespaces_id/:path', wrap(async (req, res, next) => {
  res.send(res.locals.doc);
}));

api.put('/:namespaces_id/:path', wrap(async (req, res, next) => {
  const { Dir } = app().models;
  const { path } = req.params;
  const data = req.body;
  await Dir.update(path, data);
  res.send({});
}));

api.delete('/:namespaces_id/:path', wrap(async (req, res, next) => {
  const { Dir } = app().models;
  const { path } = req.params;
  await Dir.delete(path);
  res.send({});
}));

export default api;
