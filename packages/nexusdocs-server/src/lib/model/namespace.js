import _ from 'lodash';
import archiver from 'archiver';
import getNewFilename from 'new-filename';
import qs from 'qs';

import BaseModel from 'lib/base-model';
import { isObjectId } from 'lib/schema';
import { ValidationError, buildValidationError } from 'lib/errors';
import { ApiError } from '../../../lib/lib/errors';

export default class Namespace extends BaseModel {

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

  /**
   * Get namespace provider bucket
   * @param {ObjectId} id 
   */
  async getBucket(id) {
    id = this.prepareId(id);
    const { Store } = this.service();
    let instance = this._active ? this : await this.get(id);
    const { providers_id, bucket } = instance.data();
    return Store.bucket(providers_id, bucket);
  }

  /**
   * Open a stream for uploading file binary
   * @param {object} options 
   */
  async openUploadStream(options = {}) {
    if (!this._active) {
      throw new Error('could not open upload stream on none instance');
    }
    const { md5 } = options;
    const bucket = await this.getBucket();
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
    const uploadStream = await bucket.openUploadStream(options);
    uploadStream.on('upload', async info => {
      try {
        await this.addStore(bucket, info);
        uploadStream.emit('file', info);
      } catch(err) {
        uploadStream.emit('error', err);
      }
    });
    return uploadStream;
  }

  /**
   * Save file store info
   * @param {Bucket} bucket 
   * @param {object} info 
   */
  async addStore(bucket, info) {
    const { File, FileStore } = this.model();
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
          console.error('Error deleting file from bucket', err);
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

  /**
   * Save file info
   * @param {object} info 
   */
  async addFile(info) {
    const { File } = this.model();
    return File.create({
      _id: info.files_id,
      namespace: this.name,
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

  /**
   * Open download stream
   * @param {string} storeId 
   */
  async openDownloadStream(storeId) {
    if (!this._active) {
      throw new Error('could not open upload stream on none instance');
    }
    const bucket = await this.getBucket();
    const downloadStream = await bucket.openDownloadStream(storeId);
    return downloadStream;
  }

  /**
   * Delete single file
   * @param {string|File} file 
   */
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

  /**
   * Clean up namespace, this will delete all files in it
   */
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

  /**
   * Create a archive stream for files directly for downloading
   * @param {string[]} files - files id array
   * @param {number} [options.level=6] - zip level
   */
  async createArchiveStream(files, options = {}) {
    const { level = 6 } = options;
    // TODO move creating archive operation to task queue
    const { File } = this.model();
    const archive = new archiver('zip', {
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

  /**
   * Creating archive and permanently stores it into namespace
   * Use createArchiveStream instead when necessary
   * @param {string[]} files id array
   * @param {string} name 
   */
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
    const archiveStream = new archiver('zip', {
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
      archiveStream.on('warning', reject);
      archiveStream.on('error', reject);
      archiveStream.pipe(storeStream);
      await Promise.all(_.map(files, async fileId => {
        // console.log('next file:', fileId);
        const file = await File.get(fileId);
        if (!file) {
          const err = new ApiError(404, `file not find: ${fileId}`);
          archiveStream.emit('error', err);
        }
        const fileStream = await bucket.openDownloadStream(file.store_id);
        let filename = file.filename;
        filename = getNewFilename(filenames, filename);
        // console.log('appending:', filename);
        archiveStream.append(fileStream, {
          name: filename,
          date: file.dateUploaded,
        });
      }));
      // console.log('arvhive.finalize()');
      archiveStream.finalize();
    });
  }

  /**
   * Add archive info
   * @param {object} info 
   */
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

  /**
   * Convert file format
   * @param {File|string} file - File to be converted
   * @param {string} commands - converting commands
   */
  async convert(file, commands) {
    const { File, FileStore } = this.model();
    const { FileConverter } = this.service();
    if (!(file instanceof File.constructor)) {
      file = await File.get(file);
    }
    const fileStream = await this.openDownloadStream(file.store_id);
    return FileConverter.convert(fileStream, file.filename, commands);
  }

  /**
   * Get original provider URL
   * @param {File|string} file 
   * @param {boolean} [options.download=false] - For download (overwrite content-disposition header)
   * @param {boolean} [options.processNative=false] - Process generate download url 
   * @param {number} [options.expires] - URL expires timestamp
   */
  async getOriginalUrl(file, options = {}) {
    const bucket = await this.getBucket();
    const { type } = bucket.provider.options;
    const { download, expires, processNative } = options;
    let { serverUrl } = options;
    if (type === 'gridfs') {
      if (processNative) {
        serverUrl = serverUrl || this.nds.options.restful.serverUrl;
        if (!serverUrl) {
          throw new Error('serverUrl is not set');
        }
        const query = {
          download: download ? 1 : undefined,
        };
        const url = `${serverUrl}/namespaces/${this.name}/files/{file._id}?` + qs.stringify(query);
        return url;
      } else {
        return null;
      }
    }
    const downloadOptions = {
      serverUrl,
      expires,
      download,
      contentType: file.contentType,
    };
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
    const { File, FileStore } = this.model();
    const aggregateOptions = [
      { $match: {
        namespace: this.name,
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
