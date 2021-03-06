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

api.param('clientId', wrap<Req, Res>(async (req, res, next) => {
  const { Client } = req.context.models;
  const { clientId } = req.params;
  const doc = await Client.get(clientId);
  if (!doc) {
    throw new ApiError(404);
  }
  res.locals.doc = doc;
  next();
}));

api.get('/', wrap<Req, Res>(async (req, res, next) => {
  const { Client } = req.context.models;
  const list = await Client.getAll();
  res.send(list);
}));

api.post('/', wrap<Req, Res>(async (req, res, next) => {
  const { Client } = req.context.models;
  const data = req.body;
  await Client.create(data);
  res.send({});
}));

api.get('/:clientId', wrap<Req, Res>(async (req, res, next) => {
  res.send(res.locals.doc);
}));

api.put('/:clientId', wrap<Req, Res>(async (req, res, next) => {
  const { Client } = req.context.models;
  const { clientId } = req.params;
  const data = req.body;
  await Client.update(data, { _id: clientId });
  res.send({});
}));

api.delete('/:clientId', wrap<Req, Res>(async (req, res, next) => {
  const { Client } = req.context.models;
  const { clientId } = req.params;
  await Client.delete(clientId);
  res.send({});
}));

export default api;
