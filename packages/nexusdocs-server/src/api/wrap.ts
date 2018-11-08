// import { Request, Response, ErrorRequestHandler, RequestHandler, NextFunction, RequestParamHandler } from 'express';

// export type TAsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
// export type TAsyncRequestParamHandler = (req: Request, res: Response, next: NextFunction, value: any, name: string) => Promise<void>;
// export type TAsyncErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => Promise<void>;

// export type TAsyncHandler = TAsyncRequestHandler | TAsyncRequestParamHandler | TAsyncErrorRequestHandler;
// export type TRequestHandler = ErrorRequestHandler| RequestParamHandler | RequestHandler

// export function wrap(fn: TAsyncRequestHandler): RequestHandler;
// export function wrap(fn: TAsyncRequestParamHandler): RequestParamHandler;
// export function wrap(fn: TAsyncErrorRequestHandler): ErrorRequestHandler;
// export function wrap(fn: TAsyncHandler): TRequestHandler {
//   if (fn.length <= 3) {
//     return (req: Request, res: Response, next: NextFunction) => {
//       (fn as TAsyncRequestHandler)(req, res, next).catch(next);
//     };
//   } else {
//     return function(err: T, req: U, res: V, next: W) {
//       (fn as T4ParamsRequestHandler<T,U,V,W>)(err, req, res, next).catch(next);
//     };
//   }
// }
