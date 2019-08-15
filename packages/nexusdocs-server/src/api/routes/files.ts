import * as _ from 'lodash';
import { Router } from 'express';
import { wrap } from 'async-middleware';
import * as contentDisposition from 'content-disposition';

import { ApiError } from '../../lib/errors';
import { checkAuth } from '../middleware';
import { UserRole } from '../middleware/check-auth';
import { IRequest, IResponse } from '../types';

type Req = IRequest;
type Res = IResponse;

const api = Router();

api.use(checkAuth({
  role: UserRole.Admin,
}));

api.get('/', wrap<Req, Res>(async (req, res, next) => {
  const { File } = req.context.models;
  const list = await File.getAll({});
  res.send(list);
}));

export default api;
