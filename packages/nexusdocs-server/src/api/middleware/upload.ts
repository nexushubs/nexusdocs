import * as multer from 'multer';
import { RequestHandler } from 'express';

import createResumableStorage from './resumable-storage';
import createBucketStorage from './bucket-storage';
import createSimpleStorage from './simple-storage';
import { uploadRaw } from './upload-raw';

export type StorageEngineType = 'raw' | 'bucket' | 'resumable' | 'simple';

const storages = {
  bucket: createBucketStorage(),
  resumable: createResumableStorage(),
  simple: createSimpleStorage(),
};

export default function upload(key?: StorageEngineType): RequestHandler {
  if (key === 'raw') {
    return uploadRaw();
  } else {
    return (req, res, next) => {
      let { resumable } = req.query;
      const type = key || (resumable ? 'resumable' : 'bucket');
      const storage = storages[type];
      const middleWare = multer({
        storage,
      }).single('file');
      middleWare(req, res, next);
    };
  }
}
