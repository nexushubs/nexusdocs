import _ from 'lodash';
import express from 'express';
import wrap from 'express-wrap-async';

import { ApiError } from '~/lib/errors';
import { checkAuth } from '~/api/middleware';

const api = express.Router();

api.use(checkAuth({
  role: 'admin',
}));

api.param('providers_id', wrap(async (req, res, next) => {
  const { Provider } = req.model();
  const { providers_id } = req.params;
  const doc = await Provider.get(providers_id);
  if (!doc) {
    throw new ApiError(404);
  }
  req.data.doc = doc;
  next();
}));

api.get('/', wrap(async (req, res, next) => {
  const { Provider } = req.model();
  const list = await Provider.getAll();
  res.send(list);
}));

api.post('/', wrap(async (req, res, next) => {
  const { Provider } = req.model();
  const data = req.body;
  await Provider.create(data);
  res.send({});
}));

api.get('/:providers_id', wrap(async (req, res, next) => {
  res.send(req.data.doc);
}));

api.put('/:providers_id', wrap(async (req, res, next) => {
  const { Provider } = req.model();
  const { providers_id } = req.params;
  const data = req.body;
  await Provider.update(providers_id, data);
  res.send({});
}));

api.delete('/:providers_id', wrap(async (req, res, next) => {
  const { Provider } = req.model();
  const { providers_id } = req.params;
  await Provider.delete(providers_id);
  res.send({});
}));

export default api;
