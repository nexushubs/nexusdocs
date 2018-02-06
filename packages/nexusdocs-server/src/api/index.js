import express from 'express';
import wrap from 'express-wrap-async';
import cors from 'cors';

import routes from './routes';
import { errorHandler } from './middleware';

export default function createRestApi(app) {
  const api = express();

  api.set('trust proxy', app.options.restful.trustedProxy);

  // bind app handlers
  api.use((req, res, next) => {
    app.bindLoader(req);
    res.set('X-Powered-By', 'nexusdocs-server');
    req.data = {};
    const originalUrl = req.get('X-Original-URI') || req.get('X-Original-URL') || req.originalUrl;
    const protocol = req.get('X-Forwarded-Proto') || req.protocol;
    req.fullUrl = `${protocol}://${req.get('host')}${originalUrl}`;
    req.serverUrl = req.fullUrl.replace(req.url.replace(/^\/api/, ''), '');
    if (app.options.debug.request) {
      console.log(`${req.method} ${req.url}`);
    }
    next();
  });

  api.use(cors({
    origin: '*',
  }));

  api.use(express.json());

  api.get('/', (req, res, next) => {
    res.redirect('/api');
  });

  // load routes
  api.use('/api', routes);

  // error handling
  api.use(errorHandler);

  return api;
}
