import { Readable } from 'stream';
import { StorageEngine } from 'multer';

import { ResumableParams } from '../../services/Resumable/types';
import { IRequest } from '../types';

interface ResumableFile extends Express.Multer.File {
  resumable?: ResumableParams;
  stream: Readable;
}

export class ResumableStorage implements StorageEngine {
  
  constructor(options = null) {
    
  }
  
  async _handleFile(req: IRequest, file: ResumableFile, callback: (error?: any, file?: Partial<ResumableFile>) => void) {
    try {
      const md5 = req.body.md5 || req.query.md5;
      const { Resumable } = req.context.services;
      const resumableWriteStream = await Resumable.createWriteStream(req.body);
      file.stream.pipe(resumableWriteStream);
      resumableWriteStream.on('error', callback);
      resumableWriteStream.on('done', async status => {
        if (!status.finished) {
          callback(null, {
            resumable: status,
          });
          return;
        }
        const { namespace } = req.res.locals;
        try {
          const uploadOptions = {
            filename: status.filename,
            fileId: status.identifier,
            md5,
          };
          const uploadStream = await namespace.openUploadStream(uploadOptions);
          const resumableReadStream = await Resumable.createReadStream(status);
          resumableReadStream.pipe(uploadStream)
          uploadStream.on('file', async data => {
            callback(null, {
              resumable: status,
              ...data,
            });
          });
          uploadStream.on('error', error => callback);
        } catch (error) {
          callback(error);
        }
      });
    } catch (error) {
      callback(error);
    }
  }

  _removeFile() {

  }

}

let instance: ResumableStorage = null;
  
export default function createResumableStorage() {
  if (!instance) {
    instance =  new ResumableStorage();
  }
  return instance;
}
