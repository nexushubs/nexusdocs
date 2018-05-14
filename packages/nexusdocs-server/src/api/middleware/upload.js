import multer from 'multer';

import createResumableStorage from './resumable-storage';
import createBucketStorage from './bucket-storage';
import { ApiError } from 'lib/errors';

const storages = {
  bucket: createBucketStorage(),
  resumable: createResumableStorage(),
};

export default function upload(options) {
  return (req, res, next) => {
    let { resumable } = req.query;
    const type = resumable ? 'resumable' : 'bucket';
    const storage = storages[type];
    const middleWare = multer({
      storage,
    }).single('file');
    middleWare(req, res, next);
  };
}
