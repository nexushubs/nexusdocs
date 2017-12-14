import _ from 'lodash';
import express from 'express';
import wrap from 'express-wrap-async';

import { ApiError } from '~/lib/errors';
import { checkAuth } from '~/api/middleware';

const api = express.Router();

api.use(checkAuth({
  role: 'admin',
}));

api.param('clientId', wrap(async (req, res, next) => {
  const { Client } = req.model();
  const { clientId } = req.params;
  const doc = await Client.get(clientId);
  if (!doc) {
    throw new ApiError(404);
  }
  req.data.doc = doc;
  next();
}));

api.get('/', wrap(async (req, res, next) => {
  const { Client } = req.model();
  const list = await Client.getAll();
  res.send(list);
}));

api.post('/', wrap(async (req, res, next) => {
  const { Client } = req.model();
  const data = req.body;
  await Client.create(data);
  res.send({});
}));

api.get('/:clientId', wrap(async (req, res, next) => {
  res.send(req.data.doc);
}));

api.put('/:clientId', wrap(async (req, res, next) => {
  const { Client } = req.model();
  const { clientId } = req.params;
  const data = req.body;
  await Client.update(clientId, data);
  res.send({});
}));

api.delete('/:clientId', wrap(async (req, res, next) => {
  const { Client } = req.model();
  const { clientId } = req.params;
  await Client.delete(clientId);
  res.send({});
}));

export default api;
