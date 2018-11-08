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

api.param('clientId', wrap(async (req, res, next) => {
  const { Client } = app().models;
  const { clientId } = req.params;
  const doc = await Client.get(clientId);
  if (!doc) {
    throw new ApiError(404);
  }
  res.locals.doc = doc;
  next();
}));

api.get('/', wrap(async (req, res, next) => {
  const { Client } = app().models;
  const list = await Client.getAll();
  res.send(list);
}));

api.post('/', wrap(async (req, res, next) => {
  const { Client } = app().models;
  const data = req.body;
  await Client.create(data);
  res.send({});
}));

api.get('/:clientId', wrap(async (req, res, next) => {
  res.send(res.locals.doc);
}));

api.put('/:clientId', wrap(async (req, res, next) => {
  const { Client } = app().models;
  const { clientId } = req.params;
  const data = req.body;
  await Client.update(clientId, data);
  res.send({});
}));

api.delete('/:clientId', wrap(async (req, res, next) => {
  const { Client } = app().models;
  const { clientId } = req.params;
  await Client.delete(clientId);
  res.send({});
}));

export default api;
