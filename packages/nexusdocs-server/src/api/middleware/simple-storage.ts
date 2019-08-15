import * as os from 'os';
import * as multer from 'multer';
import * as uuid from 'uuid';

let instance: multer.StorageEngine = null;

export default function createSimpleStorage() {
  if (!instance) {
    instance = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, os.tmpdir());
      },
      filename: function (req, file, cb) {
        cb(null, uuid.v4());
      }
    });
  }
  return instance;
}
