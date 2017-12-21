import _ from 'lodash';
import { Writable } from 'stream';
import archiver from 'archiver';
import getNewFilename from 'new-filename';
import { PassThrough } from 'stream';

import BaseModel from '~/lib/base-model';
import { bucketName, isObjectId } from '~/lib/schema';
import { ValidationError, buildValidationError } from '~/lib/errors';
import { ApiError } from '../../../lib/lib/errors';

export default class Namespace extends BaseModel {

  collectionName = 'namespaces';
  schema = {
    name: { type: 'string' },
    providers_id: { $isObjectId: 1 },
    bucket: { type: 'string' },
    isPublic: { type: 'boolean' },
    description: { type: 'string', optional: true },
  };
  validators = {
    isObjectId,
  };

  validProvider(providerDoc, data) {
    if (!providerDoc) {
      const error = buildValidationError(null, 'provider', 'exists', 'provider not found')
      throw new ValidationError([error]);
    }
    if (!providerDoc.buckets.includes(data.bucket)) {
      const error = buildValidationError(null, 'bucket', 'exists', 'bucket not found')
      throw new ValidationError([error]);
    }
  }

  async createByProviderName(data) {
    const { Provider } = this.model();
    const providerDoc = await Provider.collection.findOne({name: data.provider});
    this.validProvider(providerDoc, data);
    data.providers_id = providerDoc._id;
    delete data.provider;
    await this.ensureUnique({name: data.name});
    return this.create(data, true);
  }

  async beforeCreate(data) {
    const { Provider } = this.model();
    const providerDoc = await Provider.collection.find({_id: data.providers_id});
    this.validProvider(providerDoc, data);
    return this.ensureUnique({name: data.name});
  }

  async getBucket(id) {
    id = this.prepareId(id);
    const { Store } = this.service();
    let instance = this._active ? this : await this.get(id);
    const { providers_id, bucket } = instance.data();
    return Store.bucket(providers_id, bucket);
  }

  async openUploadStream(options = {}) {
    if (!this._active) {
      throw new Error('could not open upload stream on none instance');
    }
    const { filename, fileId, md5 } = options;
    const bucket = await this.getBucket();
    let uploadStream = null;
    if (md5 && /[0-9a-f]{32}/i.test(md5)) {
      // if file md5 is provided and match, skip upload to provider
      const { FileStore } = this.model();
      const store = await FileStore.collection.findOne({
        namespace: this._data.name,
        md5,
      });
      if (store) {
        options = {
          ...options,
          skip: true,
          size: store.size,
        };
      }
    }
    uploadStream = await bucket.openUploadStream(options);
    uploadStream.on('upload', async info => {
      // if there is a file with the same md5 hash,
      // delete uploaded one from provider and point the file to the original one
      try {
        await this.addStore(bucket, info);
      } catch(err) {
        uploadStream.emit('error', err.errors);
      }
      uploadStream.emit('file', info);
    });
    return uploadStream;
  }

  async addStore(bucket, info) {
    const { File, FileStore } = this.model();
    if (!info.files_id) {
      info.files_id = File.generateId();
    }
    let store = await FileStore.get({
      namespace: this.data('name'),
      md5: info.md5
    });
    if (store) {
      if (info.status !== 'skipped') {
        await bucket.delete(info._id);
      }
      const a = await store.collection.update({ _id: store.data('_id') }, {
        $addToSet: { files_id: info.files_id },
      });
    } else {
      store = await FileStore.create({
        _id: info._id,
        namespace: this.data('name'),
        files_id: [info.files_id],
        contentType: info.contentType,
        md5: info.md5,
        size: info.size,
        status: 'ok',
        metadata: info.metadata,
      });
    }
    info.store_id = store.data('_id');
    return this.addFile(info);
  }
  
  async addFile(info) {
    const { File } = this.model();
    return File.create({
      _id: info.files_id,
      namespace: this.data('name'),
      store_id: info.store_id,
      filename: info.filename,
      contentType: info.contentType,
      md5: info.md5,
      size: info.size,
      dateStarted: info.dateStarted,
      dateUploaded: info.dateUploaded,
      path: info.path,
      aliases: [],
      isDelete: false,
      metadata: {},
    });
  }

  async openDownloadStream(storeId) {
    if (!this._active) {
      throw new Error('could not open upload stream on none instance');
    }
    const bucket = await this.getBucket();
    const downloadStream = await bucket.openDownloadStream(storeId);
    return downloadStream;
  }

  async deleteFile(file) {
    if (!this._active) {
      throw new Error('could not delete file on none instance');
    }
    const { File, FileStore } = this.model();
    if (!_.isObject(file)) {
      file = await File.get(file);
    };
    if (!(file instanceof File.constructor)) {
      file = File.getInstance(file);
    }
    const info = file.data();
    const count = await File.collection.count({
      _id: { $ne: info._id },
      namespace: this.data('name'),
      store_id: info.store_id,
    });
    let promises = [
      file.delete(),
    ];
    if (count === 0) {
      const bucket = await this.getBucket();
      promises = [ ...promises,
        bucket.delete(info.store_id),
        FileStore.delete(info.store_id),
      ];
    }
    return Promise.all(promises);
  }

  async truncate() {
    // TODO move deleting operation to task queue
    if (!this._active) {
      throw new Error('could not truncate on none instance');
    }
    const { File } = this.model();
    const files = await File.collection.find({
      namespace: this._data.name,
    }).toArray();
    const promises = files.map(file => this.deleteFile(file));
    return Promise.all(promises);
  }

  async createArchive(files, name) {
    // TODO move acreating archive operation to task queue
    const { Archive, File } = this.model();
    const archive = await Archive.getByFiles(files);
    if (archive) {
      return archive;
    }
    if (!name) {
      name = `archive-${(new Date).toISOString()}`;
    }
    const bucket = await this.getBucket();
    const filename = `${name}.zip`;
    const storeStream = await bucket.openUploadStream({
      filename,
    });
    const arvhive = new archiver('zip', {
      zlib: { level: 6 },
    });
    const filenames = [];
    return new Promise(async (resolve, reject) => {
      storeStream.on('error', reject);
      storeStream.on('upload', async info => {
        info.files = files;
        const data = await this.addArchive(info);
        resolve(data);
      });
      arvhive.on('warning', reject);
      arvhive.on('error', reject);
      arvhive.pipe(storeStream);
      await Promise.all(_.map(files, async fileId => {
        console.log('next file:', fileId);
        const file = await File.get(fileId);
        if (!file) {
          const err = new ApiError(404, `file not find: ${fileId}`);
          arvhive.emit('error', err);
        }
        const fileStream = await bucket.openDownloadStream(file.store_id);
        let filename = file.filename;
        filename = getNewFilename(filenames, filename);
        console.log('appending:', filename);
        arvhive.append(fileStream, {
          name: filename,
          date: file.dateUploaded,
        });
      }));
      console.log('arvhive.finalize()');
      arvhive.finalize();
    });
  }

  async addArchive(info) {
    const { Archive } = this.model();
    const { _id: store_id, filename, files, size } = info;
    return Archive.create({
      store_id,
      filename,
      files,
      size,
    });
  }

  async convert(file, commands) {
    const { File, FileStore } = this.model();
    const { FileConverter } = this.service();
    if (!(file instanceof File.constructor)) {
      file = await File.get(file);
    }
    const fileStream = await this.openDownloadStream(file.store_id);
    const outputStream = FileConverter.convert(fileStream, file.filename, commands);
    return outputStream;
  }

}
