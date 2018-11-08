import * as express from 'express';
import { wrap } from 'async-middleware';
import * as cors from 'cors';

import routes from './routes';
import { errorHandler } from './middleware';

export default function createRestApi(app) {
  const api = express();

  api.set('trust proxy', app.options.restful.trustedProxy);

  // bind app handlers
  api.use((req, res, next) => {
    res.set('X-Powered-By', 'nexusdocs-server');
    res.locals = {};
    const originalUrl = req.get('X-Original-URI') || req.get('X-Original-URL') || req.originalUrl;
    const protocol = req.get('X-Forwarded-Proto') || req.protocol;
    res.locals.fullUrl = `${protocol}://${req.get('host')}${originalUrl}`;
    res.locals.serverUrl = res.locals.fullUrl.replace(req.url.replace(/^\/api/, ''), '');
    if (app.options.debug.request) {
      console.log(`${req.method} ${req.url}`);
    }
    req.res = res;
    req.next = next;
    res.req = req;
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
