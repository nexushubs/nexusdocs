import express from 'express';
import wrap from 'express-wrap-async';
import routes from './routes';
import { errorHandler } from './middleware';
import { app } from '~/init/application';
import cors from 'cors';

const api = express();

// bind app handlers
api.use((req, res, next) => {
  app().bindLoader(req);
  res.set('X-Powered-By', 'NexusDocs');
  req.data = {};
  process.stdout.write(`\n${req.method} ${req.url}`);
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
