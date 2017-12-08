import express from 'express';
import wrap from 'express-wrap-async';

const api = express.Router();

import { ApiError } from '~/lib/errors';
import { checkAuth } from '~/api/middleware';

// TODO

api.use(checkAuth({
  role: 'admin',
}));

api.get('/', wrap(async (req, res, next) => {
  
}));

api.get('/:namespaces_id', wrap(async (req, res, next) => {
  
}));

api.put('/:namespaces_id', wrap(async (req, res, next) => {
  
}));

api.delete('/:namespaces_id', wrap(async (req, res, next) => {
  
}));

export default api;
