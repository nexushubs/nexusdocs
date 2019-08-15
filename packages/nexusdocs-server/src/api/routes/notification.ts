import { Router } from 'express';
import { wrap } from 'async-middleware';

const api = Router();

import { ApiError } from '../../lib/errors';
import { checkAuth } from '../middleware';
import { UserRole } from '../middleware/check-auth';
import { IRequest, ILocals, AttachedResponse } from '../types';

// TODO

interface Req extends IRequest {
}

interface Locals extends ILocals {
}

interface Res extends AttachedResponse<Locals> {}

api.use(checkAuth({
  role: UserRole.Admin,
}));

api.get('/', wrap<Req, Res>(async (req, res, next) => {
  
}));

api.get('/:notification_id', wrap<Req, Res>(async (req, res, next) => {
  
}));

api.put('/:notification_id', wrap<Req, Res>(async (req, res, next) => {
  
}));

api.delete('/:notification_id', wrap<Req, Res>(async (req, res, next) => {
  
}));

export default api;
