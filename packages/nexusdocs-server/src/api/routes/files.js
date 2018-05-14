import _ from 'lodash';
import express from 'express';
import wrap from 'express-wrap-async';
import contentDisposition from 'content-disposition';

import { ApiError } from 'lib/errors';
import { upload, checkAuth } from 'api/middleware';
import { parseQueryStringHeaders } from 'lib/util';

const api = express.Router();

api.use(checkAuth({
  role: 'admin',
}));

api.get('/', wrap(async (req, res, next) => {
  const { File } = req.model();
  const list = await File.getAll({});
  res.send(list);
}));

export default api;
