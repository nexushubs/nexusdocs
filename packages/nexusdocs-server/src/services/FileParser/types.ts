import { Readable } from 'stream';
import { IFileContent } from '../../types/file';

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

export interface PdfInfo {
  numPages: number;
}

export interface FileMetaData {
  image?: ImageInfo;
  zip?: ZipInfo;
  text?: TextInfo;
  pdf?: PdfInfo;
}

export interface IFileParserService {
  parse(input: IFileContent): Promise<FileMetaData>;
}

export interface IFileParser<T extends keyof FileMetaData> {
  init?: (options: any) => Promise<void>;
  parse: () => Promise<FileMetaData[T]>;
}

export interface IFileParserStatic {
  new (input: IFileContent, config: any): IFileParser<any>;
  key: string;
  extensions: string[];
  needBuffer?: boolean;
}
