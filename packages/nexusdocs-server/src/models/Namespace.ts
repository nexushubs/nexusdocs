import * as _ from 'lodash';
import { Writable } from 'stream';
import * as archiver from 'archiver';
import { ZlibOptions } from 'zlib';
import getNewFilename from 'new-filename';
import { PassThrough } from 'stream';
import * as qs from 'qs';

import BaseModel from '../models/BaseModel';
import { bucketName, isObjectId } from '../lib/schema';
import { ValidationError, buildValidationError } from '../lib/errors';
import { ApiError } from '../lib/errors';
import { INamespace, INamespaceData, IFile, IGetUrlOptions } from './types';
import { IUploadStreamOptions, IStoreBucket, IUrlOptions } from '../services/Store/types';

export default class Namespace extends BaseModel<INamespace, INamespaceData> {

  collectionName = 'namespaces';
  schema = {
    name: { type: 'string' },
    providers_id: { $isObjectId: 1 },
    bucket: { type: 'string' },
    isPublic: { type: 'boolean', optional: true },
    isSystem: { type: 'boolean', optional: true },
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
    const { Provider } = this.models;
    const providerDoc = await Provider.collection.findOne({name: data.provider});
    this.validProvider(providerDoc, data);
    data.providers_id = providerDoc._id;
    delete data.provider;
    await this.ensureUnique({name: data.name});
    return this.create(data, true);
  }

  async beforeCreate(data) {
    const { Provider } = this.models;
    const providerDoc = await Provider.collection.find({_id: data.providers_id});
    this.validProvider(providerDoc, data);
    return this.ensureUnique({name: data.name});
  }

  async getBucket(id: any = null) {
    id = this.prepareId(id);
    const { Store } = this.services;
    let instance = this._active ? this : await this.get(id);
    const { providers_id, bucket } = instance.data();
    return Store.bucket(providers_id, bucket);
  }

  /**
   * Open a stream for uploading file binary
   */
  async openUploadStream(options: IUploadStreamOptions = {}): Promise<Writable> {
    if (!this._active) {
      throw new Error('could not open upload stream on none instance');
    }
    const { md5 } = options;
    const bucket = await this.getBucket();
    let uploadStream = null;
    if (md5 && /[0-9a-f]{32}/i.test(md5)) {
      // if file md5 is provided and match, skip upload to provider
      const { FileStore } = this.models;
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
        uploadStream.emit('error', err);
      }
      uploadStream.emit('file', info);
    });
    return uploadStream;
  }

  async addStore(bucket: IStoreBucket, info) {
    const { File, FileStore } = this.models;
    if (!info.files_id) {
      info.files_id = File.generateId();
    }
    let store = await FileStore.get({
      namespace: this.data('name'),
      md5: info.md5,
    });
    if (store) {
      if (info.status !== 'skipped') {
        try {
          await bucket.delete(info._id);
        } catch (err) {
          console.error(err);
        }
      }
      await FileStore.collection.update({
        _id: store._id
      }, {
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
    const { File } = this.models;
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

  async openDownloadStream(storeId: string) {
    if (!this._active) {
      throw new Error('could not open upload stream on none instance');
    }
    const bucket = await this.getBucket();
    const downloadStream = await bucket.openDownloadStream(storeId);
    return downloadStream;
  }

  async deleteFile(fileId: string|IFile) {
    if (!this._active) {
      throw new Error('could not delete file on none instance');
    }
    const { File, FileStore } = this.models;
    let file: IFile;
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
    let promises: Promise<any>[] = [
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

  /**
   * Clean up namespace, this will delete all files in it
   */
  async truncate() {
    // TODO move deleting operation to task queue
    if (!this._active) {
      throw new Error('could not truncate on none instance');
    }
    const { File } = this.models;
    const files = await File.collection.find({
      namespace: this._data.name,
    }).toArray();
    const promises = files.map(file => this.deleteFile(file));
    return Promise.all(promises);
  }

  async createArchiveStream(files: string[], options: ZlibOptions = {}) {
    const { level = 6 } = options;
    const { File } = this.models;
    const archive = archiver('zip', {
      zlib: { level },
    });
    const bucket = await this.getBucket();
    const filenames = [];
    await Promise.all(_.map(files, async fileId => {
      const file = await File.get(fileId);
      if (!file) {
        const err = new ApiError(404, `file not find: ${fileId}`);
        archive.emit('error', err);
      }
      const fileStream = await bucket.openDownloadStream(file.store_id);
      let filename = file.filename;
      filename = getNewFilename(filenames, filename);
      archive.append(fileStream, {
        name: filename,
        date: file.dateUploaded,
      });
    }));
    archive.finalize();
    return archive;
  }

  async createArchive(files: string[], name: string) {
    // TODO move archive operation to task queue
    const { Archive, File } = this.models;
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
    const arch = archiver('zip', {
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
      arch.on('warning', reject);
      arch.on('error', reject);
      arch.pipe(storeStream);
      await Promise.all(_.map(files, async fileId => {
        // console.log('next file:', fileId);
        const file = await File.get(fileId);
        if (!file) {
          const err = new ApiError(404, `file not find: ${fileId}`);
          arch.emit('error', err);
        }
        const fileStream = await bucket.openDownloadStream(file.store_id);
        let filename = file.filename;
        filename = getNewFilename(filenames, filename);
        // console.log('appending:', filename);
        arch.append(fileStream, {
          name: filename,
          date: file.dateUploaded,
        });
      }));
      // console.log('arch.finalize()');
      arch.finalize();
    });
  }

  /**
   * Add archive info
   * @param info 
   */
  async addArchive(info) {
    const { Archive } = this.models;
    const { _id: store_id, filename, files, size } = info;
    return Archive.create({
      store_id,
      filename,
      files,
      size,
    });
  }

  /**
   * Convert file format
   * @param file - File to be converted
   * @param commands - converting commands
   */
  async convert(file, commands: string) {
    const { File, FileStore } = this.models;
    const { FileConverter } = this.services;
    if (!(file instanceof File.constructor)) {
      file = await File.get(file);
    }
    const fileStream = await this.openDownloadStream(file.store_id);
    return FileConverter.convert(fileStream, file.filename, commands);
  }

  async getOriginalUrl(file: IFile, options: IGetUrlOptions = {}) {
    const bucket = await this.getBucket();
    const { type } = bucket.provider.options;
    const { download, processNative } = options;
    let { serverUrl } = options;
    if (type === 'gridfs') {
      if (processNative) {
        serverUrl = serverUrl || this.app.options.restful.serverUrl;
        if (!serverUrl) {
          throw new Error('serverUrl is not set');
        }
        const query = {
          download: download ? 1 : undefined,
        };
        const url = `${serverUrl}/namespaces/${this.data('name')}/files/{file._id}?` + qs.stringify(query);
        return url;
      } else {
        return null;
      }
    }
    if (download) {
      options.filename = file.filename;
    }
    const url = await bucket.getUrl(file.store_id, options);
    return url;
  }

  /**
   * Get namespace statistics information
   * @returns {{files:number,stores:number}}
   */
  async getStats() {
    const { File, FileStore } = this.models;
    const aggregateOptions = [
      { $match: {
        namespace: this.data('name'),
      }},
      { $group: {
        _id: null,
        totalSize: { $sum: '$size' },
        avgSize: { $avg: '$size' },
        count: { $sum: 1 },
      }},
    ];
    const fileStats = await File.collection.aggregate(aggregateOptions).toArray();
    const storeStats = await FileStore.collection.aggregate(aggregateOptions).toArray();
    return {
      files: _.omit(fileStats[0], '_id'),
      stores: _.omit(storeStats[0], '_id'),
    };
  }
}
