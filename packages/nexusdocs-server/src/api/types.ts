import * as express from 'express';
import Application from '../lib/Application';

export interface IRequestContext {
  app: Application;
}

export interface Request extends express.Request {
  context: IRequestContext;
}
