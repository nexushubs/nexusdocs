import { Router } from 'express';
import { wrap } from 'async-middleware';

import { ApiError } from '../../lib/errors';
import { checkAuth } from '../middleware';

const api = Router();

api.get('/', wrap(async (req, res, next) => {
  
}));

api.get('/:namespaces_id', wrap(async (req, res, next) => {
  
}));

api.put('/:namespaces_id', wrap(async (req, res, next) => {
  
}));

api.delete('/:namespaces_id', wrap(async (req, res, next) => {
  
}));

export default api;
