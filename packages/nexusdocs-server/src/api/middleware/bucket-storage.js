export class BucketStorage {

  constructor(options) {

  }
  
  async _handleFile(req, file, callback) {
    try {
      const md5 = req.body.md5 || req.query.md5;
      const { namespace } = req.data;
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

}

let instance = null;

export default function createBucketStorage() {
  if (!instance) {
    instance =  new BucketStorage();
  }
  return instance;
}
