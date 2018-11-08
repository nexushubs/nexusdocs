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

api.param('providers_id', wrap(async (req, res, next) => {
  const { Provider } = app().models;
  const { providers_id } = req.params;
  const doc = await Provider.get(providers_id);
  if (!doc) {
    throw new ApiError(404);
  }
  res.locals.doc = doc;
  next();
}));

api.get('/', wrap(async (req, res, next) => {
  const { Provider } = app().models;
  const list = await Provider.getAll();
  res.send(list);
}));

api.post('/', wrap(async (req, res, next) => {
  const { Provider } = app().models;
  const data = req.body;
  await Provider.create(data);
  res.send({});
}));

api.get('/:providers_id', wrap(async (req, res, next) => {
  res.send(res.locals.doc);
}));

api.put('/:providers_id', wrap(async (req, res, next) => {
  const { Provider } = app().models;
  const { providers_id } = req.params;
  const data = req.body;
  await Provider.update(providers_id, data);
  res.send({});
}));

api.delete('/:providers_id', wrap(async (req, res, next) => {
  const { Provider } = app().models;
  const { providers_id } = req.params;
  await Provider.delete(providers_id);
  res.send({});
}));

export default api;
