import { Router } from 'express';
import { wrap } from 'async-middleware';

import { ApiError } from '../../lib/errors';
import { checkAuth } from '../middleware';
import { IRequest, IResponse } from '../types';

type Req = IRequest;
type Res = IResponse;

const api = Router();

api.get('/', wrap<Req, Res>(async (req, res, next) => {
  
}));

api.get('/:namespaces_id', wrap<Req, Res>(async (req, res, next) => {
  
}));

api.put('/:namespaces_id', wrap<Req, Res>(async (req, res, next) => {
  
}));

api.delete('/:namespaces_id', wrap<Req, Res>(async (req, res, next) => {
  
}));

export default api;
