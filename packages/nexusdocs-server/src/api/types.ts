import { Request, Response } from 'express';
import Application from '../lib/Application';

export interface IRequest extends Request {
  context?: Application;
}

export interface IResponse extends Response {
  
}

export interface AttachedResponse<T extends ILocals> extends IResponse {
  locals: T;
}

export interface ILocals {
  serverUrl?: string;
}
