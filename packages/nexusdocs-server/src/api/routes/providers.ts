import * as _ from 'lodash';
import { Router } from 'express';
import { wrap } from 'async-middleware';

import { ApiError } from '../../lib/errors';
import { IRequest, IResponse } from '../types';
import { checkAuth } from '../middleware';
import { UserRole } from '../middleware/check-auth';

type Req = IRequest;
type Res = IResponse;

const api = Router();

api.use(checkAuth({
  role: UserRole.Admin,
}));

api.param('providers_id', wrap<Req, Res>(async (req, res, next) => {
  const { Provider } = req.context.models;
  const { providers_id } = req.params;
  const doc = await Provider.get(providers_id);
  if (!doc) {
    throw new ApiError(404);
  }
  res.locals.doc = doc;
  next();
}));

api.get('/', wrap<Req, Res>(async (req, res, next) => {
  const { Provider } = req.context.models;
  const list = await Provider.getAll();
  res.send(list);
}));

api.post('/', wrap<Req, Res>(async (req, res, next) => {
  const { Provider } = req.context.models;
  const data = req.body;
  await Provider.create(data);
  res.send({});
}));

api.get('/:providers_id', wrap<Req, Res>(async (req, res, next) => {
  res.send(res.locals.doc);
}));

api.put('/:providers_id', wrap<Req, Res>(async (req, res, next) => {
  const { Provider } = req.context.models;
  const { providers_id } = req.params;
  const data = req.body;
  await Provider.update(providers_id, data);
  res.send({});
}));

api.delete('/:providers_id', wrap<Req, Res>(async (req, res, next) => {
  const { Provider } = req.context.models;
  const { providers_id } = req.params;
  await Provider.delete(providers_id);
  res.send({});
}));

export default api;
