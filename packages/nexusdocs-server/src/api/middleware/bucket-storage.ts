import { Readable } from 'stream';
import { StorageEngine } from 'multer';
import { IRequest, AttachedResponse, ILocals } from '../types';
import { Namespace } from '../../models';

export interface File extends Express.Multer.File {
  stream: Readable;
}

interface Req extends IRequest {
  res: Res;
}

interface Locals extends ILocals {
  namespace: Namespace;
}

interface Res extends AttachedResponse<Locals> {
}

export class BucketStorage implements StorageEngine {

  async _handleFile(req: Req, file: File, callback: (error?: any, file?: Partial<File>) => void) {
    try {
      const md5 = req.body.md5 || req.query.md5;
      const { namespace } = req.res.locals;
      if (!namespace) {
        throw new Error('namespace not initialized');
      }
      const uploadOptions = {
        filename: file.originalname,
        md5,
      };
      const uploadStream = await namespace.openUploadStream(uploadOptions);
      uploadStream.on('file', data => {
        callback(null, data);
      });
      uploadStream.on('error', err => callback);
      file.stream.pipe(uploadStream);
    } catch (err) {
      callback(err);
    }
  }

  _removeFile() {

  }

}

let instance: BucketStorage = null;

export default function createBucketStorage() {
  if (!instance) {
    instance =  new BucketStorage();
  }
  return instance;
}
