import { Router } from 'express';
import { wrap } from 'async-middleware';

import { ApiError } from 'lib/errors';
import { checkAuth } from 'api/middleware';
import { UserRole } from 'api/middleware/check-auth';

const api = Router();

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
