import _ from 'lodash';
import { Writable } from 'stream';

import BaseModel from '~/lib/base-model';
import BaseBucket from '~/provider/base-bucket';
import { bucketName, isObjectId } from '~/lib/schema';
import { ValidationError, buildValidationError } from '~/lib/errors';

export default class Namespace extends BaseModel {

  name = 'namespaces';
  schema = {
    name: { type: 'string' },
    providers_id: { $isObjectId: 1 },
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

  async beforeAdd(data) {
    const { Provider } = this.model();
    const providerDoc = await Provider.collection.find({_id: data.providers_id});
    this.validProvider(providerDoc, data);
    return this.ensureUnique({name: data.name});
  }

  async bucket(id) {
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
    const bucket = await this.bucket();
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
        metadata: {},
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
      startDate: info.startDate,
      uploadDate: info.uploadDate,
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
    const bucket = await this.bucket();
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
      const bucket = await this.bucket();
      promises = [ ...promises,
        bucket.delete(info.store_id),
        FileStore.delete(info.store_id),
      ];
    }
    return Promise.all(promises);
  }

  async truncate() {
    if (!this._active) {
      throw new Error('could not truncate on none instance');
    }
    const { File } = this.model();
    // TODO move delete operation to task queue
    const files = await File.collection.find({
      namespace: this._data.name,
    }).toArray();
    const promises = files.map(file => this.deleteFile(file));
    return Promise.all(promises);
  }

}
