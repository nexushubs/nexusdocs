import * as express from 'express';

const api = express.Router();

const routes = [
  'clients',
  'dirs',
  'command',
  'dirs',
  'files',
  'namespaces',
  'notification',
  'providers',
  'snapshots',
];

routes.forEach(route => {
  const router = require(`./${route}`).default;
  api.use(`/${route}`, router);
});

api.get('/', (req, res, next) => {
  const packageJson = require('../../../package.json');
  res.send({
    server: packageJson.name,
    version: packageJson.version,
    url: res.locals.fullUrl,
    serverTime: new Date,
  });
});

export default api;
