import * as _ from 'lodash';
import * as qs from 'qs';
import * as express from 'express';
import { wrap } from 'async-middleware';
import * as cors from 'cors';

import * as routes from './routes';
import { IRequest } from './types';
import { errorHandler } from './middleware';
import Application from '../lib/Application';

export default function createRestApi(app: Application) {
  const api = express();

  api.set('trust proxy', app.options.restful.trustedProxy);

  // bind app handlers
  api.use((req: IRequest, res, next) => {
    res.set('X-Powered-By', 'nexusdocs-server');
    res.locals = {};
    const originalUrl = req.get('X-Original-URI') || req.get('X-Original-URL') || req.originalUrl;
    const protocol = req.get('X-Forwarded-Proto') || req.protocol;
    res.locals.fullUrl = `${protocol}://${req.get('host')}${originalUrl}`;
    res.locals.serverUrl = res.locals.fullUrl.replace(req.url.replace(/^\/api/, ''), '');
    if (app.options.debug.request && !(req.method === 'HEAD' && req.url === '/')) {
      console.log(`[REQUEST] ${req.method} ${req.url}${!_.isEmpty(req.query) ? `?${qs.stringify(req.query)}` : ''}`)
    }
    req.res = res;
    req.next = next;
    res.req = req;
    req.context = app;
    next();
  });

  api.use(cors({
    origin: '*',
  }));

  api.use(express.json());

  api.get('/', (req, res, next) => {
    res.redirect('/api');
  });

  api.get('/api', (req, res, next) => {
    const packageJson = require('../../package.json');
    res.send({
      server: packageJson.name,
      version: packageJson.version,
      url: res.locals.fullUrl,
      serverTime: new Date,
    });
  });
  
  // load routes
  _.each(routes, (router, key) => {
    api.use(`/api/${key}`, router);
  });

  // error handling
  api.use(errorHandler);

  return api;
}
