import { Readable } from 'stream';

export interface ImageSizeInfo {
  width?: number;
  height?: number;
  type?: string;
}

export interface ImageThumbInfo {
  thumbnailUrl?: string;
}

export interface ImageInfo extends ImageSizeInfo, ImageThumbInfo {}

export interface ZipFileInfo {
  type: string;
  path: string;
  size: number;
  lastModified: Date;
}

export interface ZipInfo {
  entries: ZipFileInfo[];
}

export interface TextInfo {
  content: string;
}

export interface FileMetaData {
  image?: ImageInfo;
  zip?: ZipInfo;
  text?: TextInfo;
}

export interface IFileParserService {
  parse(filename: string, stream: Readable): Promise<FileMetaData>;
}

export interface IFileParser {
  parse(): Promise<any>;
}
