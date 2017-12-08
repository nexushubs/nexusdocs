import express from 'express';
import wrap from 'express-wrap-async';

import { ApiError } from '~/lib/errors';
import { checkAuth } from '~/api/middleware';

const api = express.Router();

api.get('/', wrap(async (req, res, next) => {
  
}));

api.get('/:namespaces_id', wrap(async (req, res, next) => {
  
}));

api.put('/:namespaces_id', wrap(async (req, res, next) => {
  
}));

api.delete('/:namespaces_id', wrap(async (req, res, next) => {
  
}));

export default api;
