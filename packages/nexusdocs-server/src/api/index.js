import express from 'express';
import wrap from 'express-wrap-async';
import cors from 'cors';

import routes from './routes';
import { app } from '~/init/application';
import { errorHandler } from './middleware';

const api = express();

api.set('trust proxy', app().options.restful.trustedProxy);

// bind app handlers
api.use((req, res, next) => {
  app().bindLoader(req);
  res.set('X-Powered-By', 'nexusdocs-server');
  req.data = {};
  const originalUrl = req.get('X-Original-URI') || req.get('X-Original-URL');
  if (originalUrl) {
    req.originalUrl = originalUrl;
  }
  const protocol = req.get('X-Original-Proto');
  if (protocol) {
    req.protocol = protocol;
  }
  if (app().options.debug.request) {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

api.use(cors({
  origin: '*',
}));

api.use(express.json());

// load routes
api.use('/api', routes);

// error handling
api.use(errorHandler);

export default api;
