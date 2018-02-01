# nexusdocs-client

Client-SDK for [nexusdocs-server](https://github.com/nexushubs/nexusdocs/tree/master/packages/nexusdocs-server)

[NexusDocs Documentation](https://github.com/nexushubs/nexusdocs/wiki)

## Use

```bash
npm install nexusdocs-client
```

## Modules

<dl>
<dt><a href="#module_nexusdocs-client">nexusdocs-client</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#Client">Client</a></dt>
<dd><p>Class presenting NexusDocs client instance</p>
</dd>
<dt><a href="#Namespace">Namespace</a></dt>
<dd><p>Class presenting NexusDocs namespace instance</p>
</dd>
</dl>

<a name="module_nexusdocs-client"></a>

## nexusdocs-client
<a name="exp_module_nexusdocs-client--module.exports"></a>

### module.exports(options) ⇒ [<code>Client</code>](#Client) ⏏
Create a NexusDocs client instance

**Kind**: Exported function  
**See**: [new Client()](#new_Client_new)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>ServerOptions</code> | Server options, see [ServerOptions](#Client..ServerOptions) |

**Example**  
Create a client

```javascript
const createClient = require('nexusdocs-client');

// Object style server options:
const client = createClient({
  hostname: '192.168.1.6',
  port: 4001,
  apiKey: 'MY_API_KEY',
  apiSecret: 'MY_API_SECRET',
});

// URL style server options:
const client = createClient('http://MY_API_KEY:MY_API_SECRET@192.168.1.6:4001/api');
```
<a name="Client"></a>

## Client
Class presenting NexusDocs client instance

**Kind**: global class  

* [Client](#Client)
    * [new Client(options)](#new_Client_new)
    * _instance_
        * [.getNamespace(name, [options])](#Client+getNamespace) ⇒ [<code>Namespace</code>](#Namespace)
    * _inner_
        * [~ServerOptions](#Client..ServerOptions) : <code>object</code>

<a name="new_Client_new"></a>

### new Client(options)
Creates an instance of NDS Client.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ServerOptions</code> \| <code>string</code> | Server options, see [ServerOptions](#Client..ServerOptions) |

**Example**  
You can pass a URL sting instead of a config object:
```xml
http://<clientKey>:<clientSecret>@<hostname>:<port><endPoint>
```
<a name="Client+getNamespace"></a>

### client.getNamespace(name, [options]) ⇒ [<code>Namespace</code>](#Namespace)
Get namespace instance

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: [<code>Namespace</code>](#Namespace) - Namespace instance  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name |
| [options] | <code>object</code> | Additional options |

<a name="Client..ServerOptions"></a>

### Client~ServerOptions : <code>object</code>
Server options

**Kind**: inner typedef of [<code>Client</code>](#Client)  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| clientKey | <code>string</code> |  | NDS API key |
| clientSecret | <code>string</code> |  | NDS API secret |
| hostname | <code>string</code> | <code>&quot;127.0.0.1&quot;</code> | hostname |
| secure | <code>boolean</code> | <code>false</code> | Whether to use HTTPS |
| port | <code>number</code> | <code>4000</code> | Server Port |
| endPoint | <code>string</code> | <code>&quot;/api&quot;</code> | API endpoint |
| defaultUrlExpires | <code>number</code> |  | Default expires seconds |
| defaultRequestExpires | <code>number</code> |  | Default expires seconds |

<a name="Namespace"></a>

## Namespace
Class presenting NexusDocs namespace instance

**Kind**: global class  

* [Namespace](#Namespace)
    * [new Namespace(client, name, options)](#new_Namespace_new)
    * _instance_
        * [.getUploadUrl([options])](#Namespace+getUploadUrl) ⇒ <code>string</code>
        * [.getDownloadUrl(fileId, [options])](#Namespace+getDownloadUrl) ⇒ <code>string</code>
        * [.getConvertedUrl(fileId, converting, [options])](#Namespace+getConvertedUrl) ⇒ <code>string</code>
        * [.upload(Buffer|ReadableStream, [options])](#Namespace+upload) ⇒ <code>Promise</code>
        * [.openUploadStream([options])](#Namespace+openUploadStream) ⇒ <code>WritableStream</code>
        * [.uploadFromLocal(filePath, options)](#Namespace+uploadFromLocal) ⇒ <code>Promise</code>
        * [.openDownloadStream(fileId, [options])](#Namespace+openDownloadStream) ⇒ <code>ReadableStream</code>
        * [.downloadToLocal(fileId, filePath, [options])](#Namespace+downloadToLocal) ⇒ <code>Promise</code>
        * [.getFileInfo(fileId)](#Namespace+getFileInfo) ⇒ <code>Promise</code>
        * [.delete(fileId)](#Namespace+delete) ⇒ <code>Promise</code>
        * [.truncate()](#Namespace+truncate) ⇒ <code>Promise</code>
        * [.createArchive(files)](#Namespace+createArchive) ⇒ <code>Promise</code>
        * [.getArchiveUrl(files, options)](#Namespace+getArchiveUrl)
    * _inner_
        * [~RequestOptions](#Namespace..RequestOptions) : <code>object</code>
        * [~UploadOptions](#Namespace..UploadOptions) : <code>object</code>
        * [~DownloadOptions](#Namespace..DownloadOptions) : <code>object</code>
        * [~FileId](#Namespace..FileId) : <code>string</code>
        * [~ImageInfo](#Namespace..ImageInfo) : <code>object</code>
        * [~ZipFileEntry](#Namespace..ZipFileEntry) : <code>object</code>
        * [~ZipInfo](#Namespace..ZipInfo) : <code>object</code>
        * [~FileInfo](#Namespace..FileInfo) : <code>object</code>
        * [~ConvertingOptions](#Namespace..ConvertingOptions) : <code>object</code>

<a name="new_Namespace_new"></a>

### new Namespace(client, name, options)
Namespace Class constructor


| Param | Type | Description |
| --- | --- | --- |
| client | [<code>Client</code>](#Client) | NDS Client instance |
| name | <code>string</code> | The name of namespace |
| options | <code>object</code> |  |

**Example**  
Create a namespace instance

```javascript
const namespace = client.getNamespace('a.name.space');
```
<a name="Namespace+getUploadUrl"></a>

### namespace.getUploadUrl([options]) ⇒ <code>string</code>
Get URL for upload

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <code>string</code> - URL for upload  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>RequestOptions</code> | Additional options, see [RequestOptions](#Namespace..RequestOptions) |
| [options.resumable] | <code>boolean</code> | If upload with resumbable.js |
| [options.expires] | <code>date</code> | Timestamp the Request will available before |

<a name="Namespace+getDownloadUrl"></a>

### namespace.getDownloadUrl(fileId, [options]) ⇒ <code>string</code>
Get file URL for view or download

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <code>string</code> - file URL  

| Param | Type | Description |
| --- | --- | --- |
| fileId | <code>FileId</code> | File identifier, see [FileId](#Namespace..FileId) |
| [options] | <code>DownloadOptions</code> | Additional options, see [DownloadOptions](#Namespace..DownloadOptions) |

<a name="Namespace+getConvertedUrl"></a>

### namespace.getConvertedUrl(fileId, converting, [options]) ⇒ <code>string</code>
Get the converted file URL for view or download

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <code>string</code> - The converted file URL  

| Param | Type | Description |
| --- | --- | --- |
| fileId | <code>FileId</code> | File identifier, see [FileId](#Namespace..FileId) |
| converting | <code>ConvertingOptions</code> | Converting options, see [ConvertingOptions](#Namespace..ConvertingOptions) |
| [options] | <code>DownloadOptions</code> | Additional options, see [DownloadOptions](#Namespace..DownloadOptions) |

<a name="Namespace+upload"></a>

### namespace.upload(Buffer|ReadableStream, [options]) ⇒ <code>Promise</code>
Upload file from Buffer, ReadableStream

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Fulfil**: <code>object</code> File info when uploading is finished  
**Reject**: <code>any</code> Request error  

| Param | Type | Description |
| --- | --- | --- |
| Buffer|ReadableStream | <code>data</code> | File data |
| [options] | <code>UploadOptions</code> | Additional options, see [UploadOptions](#Namespace..UploadOptions) |

<a name="Namespace+openUploadStream"></a>

### namespace.openUploadStream([options]) ⇒ <code>WritableStream</code>
Get upload stream

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <code>WritableStream</code> - Writable stream for upload  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>UploadOptions</code> | Additional options, see [UploadOptions](#Namespace..UploadOptions) |
| [options.stream] | <code>ReadableStream</code> | Provide readable stream directly |

<a name="Namespace+uploadFromLocal"></a>

### namespace.uploadFromLocal(filePath, options) ⇒ <code>Promise</code>
Upload a file from local file-system

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Fulfil**: <code>FileInfo</code> File info when uploading is finished  
**Reject**: <code>any</code> Request error  

| Param | Type | Description |
| --- | --- | --- |
| filePath | <code>string</code> | The path of file will be uploaded |
| options | <code>UploadOptions</code> | Upload options |

<a name="Namespace+openDownloadStream"></a>

### namespace.openDownloadStream(fileId, [options]) ⇒ <code>ReadableStream</code>
Get a readable stream for download

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <code>ReadableStream</code> - - the readable stream  

| Param | Type | Description |
| --- | --- | --- |
| fileId | <code>FileId</code> | The file needed to download later, see [FileId](#Namespace..FileId) |
| [options] | <code>RequestOptions</code> | Additional options, see [RequestOptions](#Namespace..RequestOptions) |

<a name="Namespace+downloadToLocal"></a>

### namespace.downloadToLocal(fileId, filePath, [options]) ⇒ <code>Promise</code>
Download a file to local file-system

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Fulfil**: <code>any</code> Download finished  

| Param | Type | Description |
| --- | --- | --- |
| fileId | <code>FileId</code> | The file id, see [FileId](#Namespace..FileId) |
| filePath | <code>string</code> | The path of file will be saved |
| [options] | <code>RequestOptions</code> | Additional options, see [RequestOptions](#Namespace..RequestOptions) |

<a name="Namespace+getFileInfo"></a>

### namespace.getFileInfo(fileId) ⇒ <code>Promise</code>
Get file information

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Fulfil**: <code>FileInfo</code> file information  

| Param | Type |
| --- | --- |
| fileId | <code>FileId</code> | 

<a name="Namespace+delete"></a>

### namespace.delete(fileId) ⇒ <code>Promise</code>
Delete a file on the server

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Fulfil**: <code>object</code> When deletion is finished  
**Reject**: <code>any</code> When a error occur  

| Param | Type | Description |
| --- | --- | --- |
| fileId | <code>FileId</code> | The file to be deleted, see [FileId](#Namespace..FileId) |

<a name="Namespace+truncate"></a>

### namespace.truncate() ⇒ <code>Promise</code>
Delete all files in this namespace

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
<a name="Namespace+createArchive"></a>

### namespace.createArchive(files) ⇒ <code>Promise</code>
Create an archive

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  

| Param | Type | Description |
| --- | --- | --- |
| files | <code>Array.&lt;FileId&gt;</code> | file id array |

<a name="Namespace+getArchiveUrl"></a>

### namespace.getArchiveUrl(files, options)
Archive files then return download URL

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  

| Param | Type | Description |
| --- | --- | --- |
| files | <code>Array.&lt;FileId&gt;</code> | file id array, see [FileId](#Namespace..FileId) |
| options | <code>RequestOptions</code> | RequestOptions, see [RequestOptions](#Namespace..RequestOptions) |

<a name="Namespace..RequestOptions"></a>

### Namespace~RequestOptions : <code>object</code>
Request options for [request](https://github.com/request/request#requestoptions-callback),
some properties are added for additional use, see specified method

**Kind**: inner typedef of [<code>Namespace</code>](#Namespace)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | HTTP method of the request |
| url | <code>string</code> | Path of the request, or full url |
| body | <code>string</code> | Entire body for PATCH, PUT, POST or DELETE, `json` must be `true` and only plain object is allowed |
| json | <code>boolean</code> | Set to `true` when providing `body` |
| expires | <code>number</code> \| <code>date</code> | Expires time in second, timestamp or Date object, the request will be invalid after this timestamp |
| signature | <code>object</code> | Additional signature data besides `method`, `url`, `expires` |

<a name="Namespace..UploadOptions"></a>

### Namespace~UploadOptions : <code>object</code>
Upload request options

**Kind**: inner typedef of [<code>Namespace</code>](#Namespace)  
**Extends**: <code>RequestOptions</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| fileId | <code>FileId</code> | Specify fileId, see [FileId](#Namespace..FileId) |
| filename | <code>string</code> | Provide filename |
| md5 | <code>string</code> | MD5 hash of the file if available |
| contentType | <code>string</code> | Provide content-type for download |
| knownLength | <code>number</code> | Provide stream total length if available |

<a name="Namespace..DownloadOptions"></a>

### Namespace~DownloadOptions : <code>object</code>
Download options

**Kind**: inner typedef of [<code>Namespace</code>](#Namespace)  
**Extends**: <code>RequestOptions</code>  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| origin | <code>boolean</code> | <code>false</code> | Download from the origin provider |
| download | <code>boolean</code> | <code>false</code> | Download with the original filename |
| filename | <code>string</code> |  | Download with new filename, this will set contentType & contentDisposition |
| response | <code>object</code> |  | Overwrite response header |
| response.contentType | <code>string</code> |  | Overwrite Content-Type |
| response.contentDisposition | <code>string</code> |  | Overwrite Content-Disposition |

<a name="Namespace..FileId"></a>

### Namespace~FileId : <code>string</code>
File identifier

**Kind**: inner typedef of [<code>Namespace</code>](#Namespace)  
**Example**  
```js
Example file id: `e5ac71cf-a0f0-46b5-9070-268ae97bb769`
```
<a name="Namespace..ImageInfo"></a>

### Namespace~ImageInfo : <code>object</code>
Image file info

**Kind**: inner typedef of [<code>Namespace</code>](#Namespace)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| width | <code>number</code> | Image width |
| height | <code>number</code> | Image height |
| type | <code>number</code> | Image type, e.g. jpeg, png, gif |
| thumbnailUrl | <code>string</code> | Image thumbnail data-url |

<a name="Namespace..ZipFileEntry"></a>

### Namespace~ZipFileEntry : <code>object</code>
Zip file entry

**Kind**: inner typedef of [<code>Namespace</code>](#Namespace)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Relative path to zip archive |
| size | <code>number</code> | Stored size |
| lastModified | <code>date</code> | Last modified date |

<a name="Namespace..ZipInfo"></a>

### Namespace~ZipInfo : <code>object</code>
Zip file info

**Kind**: inner typedef of [<code>Namespace</code>](#Namespace)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| entries | <code>Array.&lt;ZipFileEntry&gt;</code> | files |

<a name="Namespace..FileInfo"></a>

### Namespace~FileInfo : <code>object</code>
File information

**Kind**: inner typedef of [<code>Namespace</code>](#Namespace)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| namespace | <code>string</code> | Namespace file is stored in |
| md5 | <code>string</code> | MD5 hash string |
| contentType | <code>string</code> | File content type |
| size | <code>number</code> | File total length |
| metadata | <code>object</code> | Additional information |
| metadata.image | <code>ImageInfo</code> | Metadata for image files |
| metadata.zip | <code>ZipInfo</code> | Zip file entries |

<a name="Namespace..ConvertingOptions"></a>

### Namespace~ConvertingOptions : <code>object</code>
File converting options

**Kind**: inner typedef of [<code>Namespace</code>](#Namespace)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| format | <code>string</code> | The output format, `documents`: `pdf`, `image`: `gif`, `jpeg`, `png`, `webp`, `tiff` |
| resize | <code>string</code> | For `image`, resize the image `<width>x<height>{%}{@}{!}{<}{>}`    please check [GraphicsMagick](http://www.graphicsmagick.org/GraphicsMagick.html#details-resize).    notice: only `{!}{>}{^}` are available when the server is using `ImageSharpConverter` |
| rotate | <code>string</code> \| <code>number</code> | For `image`, rotate the image by angle `{auto}{90}{180}{270}`,    if `auto` is set, the angle will be detected by gravity from EXIF |
| quality | <code>number</code> | For`image`, set the output image quality 0 - 100, available for format `jpeg`, `tiff`, `webp` |

**Example**  
Get a thumbnail of size 32px
```javascript
{
  format: 'jpeg',
  resize: '32x32',
  rotate: 'auto'
}
```
**Example**  
Get a pdf version of a document
```javascript
{
  format: 'pdf',
}
```

* * *

## License

MIT
