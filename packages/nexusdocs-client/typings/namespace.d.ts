/// <reference types="node" />
/// <reference types="request" />
import { Readable } from 'stream';
import Client from './client';
import { NamespaceOptions, RequestOptions, FileId, DownloadOptions, ConvertingOptions, UploadUrlOptions, UploadOptions, UploadStreamOptions } from './types';
/**
 * Class presenting NexusDocs namespace instance
 *
 * @example Create a namespace instance
 *
 * ```javascript
 * const namespace = client.getNamespace('a.name.space');
 * ```
 * @typicalname namespace
 */
declare class Namespace {
    client: Client;
    name: string;
    options: NamespaceOptions;
    baseUrl: string;
    /**
     * Namespace Class constructor
     * @param client - NDS Client instance
     * @param name - The name of namespace
     * @param options
     */
    constructor(client: Client, name: string, options?: NamespaceOptions);
    /**
     * Get URL for upload
     * @param options - Additional options
     * @returns {string} URL for upload
     */
    getUploadUrl(options?: UploadUrlOptions): string;
    /**
     * Get file URL for view or download
     * @param fileId - File identifier
     * @param options - Additional options
     * @returns file URL
     */
    getDownloadUrl(fileId: FileId, options?: DownloadOptions): string;
    /**
     * Get the converted file URL for view or download
     * @param fileId - File identifier
     * @param converting - Converting options
     * @param options - Additional options
     * @returns The converted file URL
     */
    getConvertedUrl(fileId: FileId, converting?: ConvertingOptions, options?: RequestOptions): string;
    /**
     * Upload file from Buffer, ReadableStream
     * @param data - File data
     * @param options - Additional options
     * @returns Promise of uploading request
     */
    upload(data: Buffer | Readable, options: UploadOptions): Promise<{}>;
    /**
     * Get upload stream
     * @param options - Additional options
     * @returns A writable stream for upload
     */
    openUploadStream(options: UploadStreamOptions): Readable;
    /**
     * Upload a file from local file-system
     * @param filePath - The path of file will be uploaded
     * @param options - Upload options
     * @returns Promise of uploading request
     */
    uploadFromLocal(filePath: string, options: UploadOptions): Promise<{}>;
    /**
     * Get a readable stream for download
     * @param fileId - The file needed to download later
     * @param options - Additional options
     * @returns the readable stream
     */
    openDownloadStream(fileId: FileId, options?: RequestOptions): import("request").Request;
    /**
     * Download a file to local file-system
     * @param fileId - The file id
     * @param filePath - The path of file will be saved
     * @param options - Additional options
     * @returns Promise of downloading request
     */
    downloadToLocal(fileId: FileId, filePath: string, options?: DownloadOptions): Promise<{}>;
    /**
     * Get file information
     * @param fileId
     * @returns Promise of file info
     */
    getFileInfo(fileId: FileId): Promise<{}>;
    /**
     * Delete a file on the server
     * @param fileId - The file to be deleted
     * @returns Promise of deleting request
     */
    delete(fileId: FileId): Promise<{}>;
    /**
     * Delete all files in this namespace
     */
    truncate(): Promise<{}>;
    /**
     * Create an archive
     * @param files - file id array
     */
    createArchive(files: FileId[]): Promise<{}>;
    /**
     * Archive files then return download URL
     * @param files - file id array
     * @param options - RequestOptions
     */
    getArchiveUrl(files: FileId[], options?: DownloadOptions): string;
    /**
     * Search similar doc of specified file
     * @param fileId
     */
    searchSimilarDoc(fileId: FileId): Promise<{}>;
}
export default Namespace;
