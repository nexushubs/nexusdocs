import * as _ from 'lodash';
import { Router } from 'express';
import { wrap } from 'async-middleware';

import { ApiError } from '../../lib/errors';
import { checkAuth } from '../middleware';
import { UserRole } from '../middleware/check-auth';
import { IRequest, IResponse } from '../types';

type Req = IRequest;
type Res = IResponse

const api = Router();

api.use(checkAuth({
  role: UserRole.Admin,
}));

api.param('namespaces_id', wrap<Req, Res>(async (req, res, next) => {
  const { Namespace } = req.context.models;
  const { namespaces_id } = req.params;
  const doc = await Namespace.get(namespaces_id);
  if (!doc) {
    throw new ApiError(404, 'Namespace not Found');
  }
  res.locals.namespace = doc;
  next();
}));

api.param('path', wrap<Req, Res>(async (req, res, next) => {
  const { Dir } = req.context.models;
  const { path } = req.params;
  const doc = await Dir.get(path);
  if (!doc) {
    throw new ApiError(404, 'Dir not Found');
  }
  res.locals.Dir = doc;
  next();
}));

api.get('/:namespaces_id', wrap<Req, Res>(async (req, res, next) => {
  const { Dir } = req.context.models;
  const list = await Dir.getAll();
  res.send(list);
}));

api.post('/:namespaces_id', wrap<Req, Res>(async (req, res, next) => {
  const { Dir } = req.context.models;
  const data = req.body;
  await Dir.create(data);
  res.send({});
}));

api.get('/:namespaces_id/:path', wrap<Req, Res>(async (req, res, next) => {
  res.send(res.locals.doc);
}));

api.put('/:namespaces_id/:path', wrap<Req, Res>(async (req, res, next) => {
  const { Dir } = req.context.models;
  const { path } = req.params;
  const data = req.body;
  await Dir.update(data, { path });
  res.send({});
}));

api.delete('/:namespaces_id/:path', wrap<Req, Res>(async (req, res, next) => {
  const { Dir } = req.context.models;
  const { path } = req.params;
  await Dir.delete(path);
  res.send({});
}));

export default api;
