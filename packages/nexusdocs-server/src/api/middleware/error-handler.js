import { ApiError, ValidationError } from '~/lib/errors';

export default function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    err = new ApiError(400, 'Invalid Input', err.errors);
  }
  if (err instanceof ApiError) {
    console.error(`=> ApiError: ${err.code} ${err.message},`, err.errors);
  } else {
    const errors = process.env.NODE_ENV == 'production' ? undefined : err.stack.split('\n');
    console.error(err);
    err = new ApiError(500, undefined, errors);
  }
  res.status(err.code).send({
    status: err.code,
    message: err.message,
    errors: err.errors,
  });
}
