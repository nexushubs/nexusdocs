import express from 'express';

const api = express();

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
  res.send({
    version: '1.0',
  });
});

export default api;
