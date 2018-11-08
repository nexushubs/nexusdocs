import * as _ from 'lodash';
import { Router } from 'express';
import { wrap } from 'async-middleware';
import * as contentDisposition from 'content-disposition';

import { app } from '../../lib/Application';
import { ApiError } from '../../lib/errors';
import { checkAuth } from '../middleware';
import { UserRole } from '../middleware/check-auth';

const api = Router();

api.use(checkAuth({
  role: UserRole.Admin,
}));

api.get('/', wrap(async (req, res, next) => {
  const { File } = app().models;
  const list = await File.getAll({});
  res.send(list);
}));

export default api;
