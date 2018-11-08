import { Router } from 'express';
import { wrap } from 'async-middleware';

const api = Router();

import { ApiError } from '../../lib/errors';
import { checkAuth } from '../middleware';
import { UserRole } from '../middleware/check-auth';

// TODO

api.use(checkAuth({
  role: UserRole.Admin,
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
