export class ResumableStorage {
  
  constructor(options) {

  }
  
  async _handleFile(req, file, callback) {
    try {
      const md5 = req.body.md5 || req.query.md5;
      const { resumable } = req.service();
      const resumableWriteStream = await resumable.createWriteStream(req.body, file.stream, callback);
      resumableWriteStream.on('error', callback);
      resumableWriteStream.on('done', async status => {
        if (!status.finished) {
          callback(null, {
            resumable: status,
          });
          return;
        }
        const { namespace } = req.data;
        try {
          const uploadOptions = {
            filename: status.filename,
            fileId: status.identifier,
            md5,
          };
          const uploadStream = await namespace.openUploadStream(uploadOptions);
          resumable.createReadStream(status, uploadStream);
          uploadStream.on('error', callback);
          uploadStream.on('file', async data => {
            callback(null, {
              resumable: status,
              ...data,
            });
          });
        } catch (error) {
          callback(error);
        }
      });
    } catch (error) {
      callback(error);
    }
  }

}

let instance = null;
  
export default function createResumableStorage() {
  if (!instance) {
    instance =  new ResumableStorage();
  }
  return instance;
}
