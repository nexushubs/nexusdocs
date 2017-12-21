import express from 'express';
import wrap from 'express-wrap-async';
import cors from 'cors';

import routes from './routes';
import { app } from '~/init/application';
import { errorHandler } from './middleware';

const api = express();

// bind app handlers
api.use((req, res, next) => {
  app().bindLoader(req);
  res.set('X-Powered-By', 'nexusdocs-server');
  req.data = {};
  console.log(`${req.method} ${req.url}`);
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
