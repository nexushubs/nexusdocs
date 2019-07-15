import * as _ from 'lodash';
import { Writable } from 'stream';
import * as archiver from 'archiver';
import { ZlibOptions } from 'zlib';
import getNewFilename from 'new-filename';
import * as qs from 'qs';
import { ObjectId } from 'mongodb';

import BaseModel from './BaseModel';
import { IFileContent } from '../types/file';
import { isObjectId } from '../lib/schema';
import { ApiError, ValidationError, buildValidationError } from '../lib/errors';
import { IUploadStreamOptions, IFileUploadInfo, IBucket } from '../services/Store/types';
import { IBaseData } from './types';
import File, { FileData } from './File';
import Archive from './Archive';
import UploadStream from '../services/Store/UploadStream';

export interface IFileStats {
  totalSize: number;
  avgSize: number;
  count: number;
}

export interface INamespaceStats {
  files: IFileStats;
  stores: IFileStats;
}

export interface GetUrlOptions {
  processNative?: boolean;
  download?: boolean;
  serverUrl?: string;
  filename?: string;
}

export interface SimilarDocQuery {
  id?: string;
  content?: string;
}

export interface NamespaceData extends IBaseData {
  name?: string;
  providers_id?: string;
  bucket?: string;
  isPublic?: boolean;
  isSystem?: boolean;
  description?: string;
}

class Namespace extends BaseModel<Namespace, NamespaceData> {

  static collectionName = 'namespaces';
  static schema = {
    name: { type: 'string' },
    providers_id: { type: 'string' },
    bucket: { type: 'string' },
    isPublic: { type: 'boolean', optional: true },
    isSystem: { type: 'boolean', optional: true },
    description: { type: 'string', optional: true },
  };
  static validators = {
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

  async getBucket(id: string = null) {
    id = this.prepareId(id);
    const { Store } = this.services;
    let instance = this._active ? this : await this.get(id);
    const { providers_id, bucket } = instance.data();
    return Store.bucket(providers_id, bucket);
  }

  /**
   * Open a stream for uploading file binary
   */
  async openUploadStream(options: IUploadStreamOptions = {}): Promise<UploadStream> {
    this.forceActiveModel();
    const { md5 } = options;
    const bucket = await this.getBucket();
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
    const uploadStream = await bucket.openUploadStream(options);
    uploadStream.on('upload', async (info: IFileUploadInfo) => {
      // if there is a file with the same md5 hash,
      // delete uploaded one from provider and point the file to the original one
      try {
        await this.addStore(bucket, info);
        uploadStream.emit('file', info);
      } catch(err) {
        console.error(err);
        uploadStream.emit('error', err);
      }
    });
    return uploadStream;
  }

  async addStore(bucket: IBucket, info: IFileUploadInfo) {
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
        setImmediate(async () => {
          try {
            await bucket.delete(info._id);
          } catch (err) {
            console.error(err);
          }
        })
      }
      await FileStore.collection.updateOne({
        _id: store._id
      }, {
        $addToSet: { files_id: info.files_id },
      });
      await FileStore.es.update(store._id, {
        script: {
          source: `ctx._source.files_id.add(params.files_id)`,
          params: { files_id: info.files_id },
        },
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
    await this.addFile(info);
  }

  async addFile(info: IFileUploadInfo) {
    const { File } = this.models;
    await File.create({
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
    this.forceActiveModel();
    const bucket = await this.getBucket();
    const downloadStream = await bucket.openDownloadStream(storeId);
    return downloadStream;
  }

  async deleteFile(fileId: string | FileData) {
    this.forceActiveModel();
    const { File, FileStore } = this.models;
    let file: File;
    if (_.isString(fileId)) {
      file = await File.get(fileId);
    } else if (_.isPlainObject(fileId)) {
      file = File.getInstance(fileId);
    }
    const info = file.data();
    const store = await FileStore.get(file.store_id);
    if (!store) {
      throw new ApiError(500, 'file store broken', { store_id: file.store_id});
    }
    await file.delete();
    _.pull(store.files_id, file._id);
    if (store.files_id.length === 0) {
      const bucket = await this.getBucket();
      await bucket.delete(info.store_id);
      await FileStore.delete(info.store_id);
    } else {
      await FileStore.collection.updateOne({ _id: store._id }, {
        $pull: { files_id: file._id },
      });
      await FileStore.es.update(store._id, {
        script: {
          source: `ctx._source.files_id.remove(ctx._source.files_id.indexOf(params.file_id))`,
          params: { file_id: file._id },
        },
      });
    }
  }

  /**
   * Clean up namespace, this will delete all files in it
   */
  async truncate() {
    // TODO move deleting operation to task queue
    this.forceActiveModel();
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
    return new Promise<Archive>(async (resolve, reject) => {
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
  async convert(file: File, commands: string): Promise<IFileContent> {
    const { File } = this.models;
    const { FileConverter } = this.services;
    if (!(file instanceof File.constructor)) {
      file = await File.get(file);
    }
    const commandsChain = commands.split('/convert/');
    let output: IFileContent = {
      getStream: async () => this.openDownloadStream(file.store_id),
      contentType: file.contentType,
      filename: file.filename,
    };
    let cacheKey = file.store_id;
    for (let i = 0; i < commandsChain.length; i++) {
      const cmd = commandsChain[i];
      cacheKey += `:/convert/${cmd}`;
      output = await FileConverter.convert(output, cmd, {
        id: i === 0 ? file.store_id : null,
        key: cacheKey,
      });
      // console.log(file.store_id, cmd, output);
    }
    return output;
  }

  async getOriginalUrl(file: FileData, options: GetUrlOptions = {}) {
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
   */
  async getStats(): Promise<INamespaceStats> {
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
    const [fileStats] = await File.collection.aggregate(aggregateOptions).toArray() as any;
    const [storeStats] = await FileStore.collection.aggregate(aggregateOptions).toArray() as any;
    return {
      files: fileStats,
      stores: storeStats,
    };
  }

  async searchSimilarDoc(query: SimilarDocQuery = {}) {
    this.forceActiveModel();
    const { File } = this.models;
    const { id, content } = query;
    let result;
    if (id) {
      const file = await File.get(id);
      if (!file) {
        throw new ApiError(400, 'file_not_exists', 'the file specified does not exist');
      }
      const { hits } = await File.es.search({
        query: {
          bool: {
            filter: [
              { term: { namespace: this.data('name') } },
            ],
            should: [
              { match: { md5: { query: file.md5, boost: 10 } } },
              { match: { filename: { query: file.filename, boost: 5 } } },
              { term: { contentType: file.contentType } },
            ],
            must_not: {
              term: {
                _id: file._id,
              },
            }
          }
        }
      });
      result = hits;
    } else if (content) {
      throw new ApiError(501, 'Searching similar doc by content is not implemented')
    }
    return result;
  }
}

interface Namespace extends NamespaceData {}

export default Namespace;
