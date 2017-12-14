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

| Param | Type |
| --- | --- |
| options | <code>ServerOptions</code> | 

**Example**  
Create a client

```javascript
const createClient = require('nexusdocs-client');

// Object style server options:
const NDS = createClient({
  hostname: '192.168.1.6',
  port: 4001,
  apiKey: 'MY_API_KEY',
  apiSecret: 'MY_API_SECRET',
});

// URL style server options:
const NDS = createClient('http://MY_API_KEY:MY_API_SECRET@192.168.1.6:4001/api');
```
<a name="Client"></a>

## Client
Class presenting NexusDocs client instance

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| options | <code>ServerOptions</code> | Server options, see [ServerOptions](#Client..ServerOptions) |


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

### nds.getNamespace(name, [options]) ⇒ [<code>Namespace</code>](#Namespace)
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
| options.clientKey | <code>string</code> |  | NDS API key |
| options.clientSecret | <code>string</code> |  | NDS API secret |
| options.hostname | <code>string</code> | <code>&quot;127.0.0.1&quot;</code> | hostname |
| options.secure | <code>boolean</code> | <code>false</code> | Whether to use HTTPS |
| options.port | <code>number</code> | <code>4000</code> | Server Port |
| options.endPoint | <code>string</code> | <code>&quot;/api&quot;</code> | API endpoint |
| options.defaultUrlExpires | <code>number</code> |  | Default expires seconds |
| options.defaultRequestExpires | <code>number</code> |  | Default expires seconds |

<a name="Namespace"></a>

## Namespace
Class presenting NexusDocs namespace instance

**Kind**: global class  

* [Namespace](#Namespace)
    * [new Namespace(client, name, options)](#new_Namespace_new)
    * _instance_
        * [.getUploadUrl([options])](#Namespace+getUploadUrl) ⇒ <code>string</code>
        * [.getDownloadUrl(fileId, [options])](#Namespace+getDownloadUrl) ⇒ <code>string</code>
        * [.openUploadStream([options])](#Namespace+openUploadStream) ⇒ <code>WritableStream</code>
        * [.uploadFromLocal(filePath)](#Namespace+uploadFromLocal) ⇒ <code>Promise</code>
        * [.openDownloadStream(fileId, [options])](#Namespace+openDownloadStream) ⇒ <code>ReadableStream</code>
        * [.downloadToLocal(fileId, filePath, [options])](#Namespace+downloadToLocal) ⇒ <code>Promise</code>
        * [.delete(fileId)](#Namespace+delete) ⇒ <code>Promise</code>
        * [.truncate()](#Namespace+truncate) ⇒ <code>Promise</code>
        * [.createArchive(files)](#Namespace+createArchive) ⇒ <code>Promise</code>
        * [.getArchiveUrl(files, options)](#Namespace+getArchiveUrl)
    * _inner_
        * [~RequestOptions](#Namespace..RequestOptions) : <code>object</code>
        * [~FileId](#Namespace..FileId) : <code>string</code>

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
const namespace = NDS.getNamespace('a.name.space');
```
<a name="Namespace+getUploadUrl"></a>

### namespace.getUploadUrl([options]) ⇒ <code>string</code>
Get URL for upload

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <code>string</code> - URL for upload  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | Additional options, see [RequestOptions](#Namespace..RequestOptions) |
| [options.resumable] | <code>boolean</code> | If upload with resumbable.js |
| [options.expires] | <code>date</code> | Timestamp the Request will available before |

<a name="Namespace+getDownloadUrl"></a>

### namespace.getDownloadUrl(fileId, [options]) ⇒ <code>string</code>
Get file URL for view or download

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <code>string</code> - file URL  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fileId | <code>FileId</code> |  | File identifier, see [FileId](#Namespace..FileId) |
| [options] | <code>RequestOptions</code> |  | Additional options, see [RequestOptions](#Namespace..RequestOptions) |
| [options.download] | <code>boolean</code> | <code>false</code> | Download with the original filename |
| [options.filename] | <code>string</code> |  | Download with new filename, this will set contentType & contentDisposition |
| [options.response] | <code>object</code> |  | Overwrite response header |
| [options.response.contentType] | <code>string</code> |  | Overwrite Content-Type |
| [options.response.contentDisposition] | <code>string</code> |  | Overwrite Content-Disposition |

<a name="Namespace+openUploadStream"></a>

### namespace.openUploadStream([options]) ⇒ <code>WritableStream</code>
Get upload stream

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <code>WritableStream</code> - Writable stream for upload  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>RequestOptions</code> | Additional options, see [RequestOptions](#Namespace..RequestOptions) |
| [options.stream] | <code>ReadableStream</code> | Provide readable stream directly |
| [options.fileId] | <code>FileId</code> | Specify fileId, see [FileId](#Namespace..FileId) |
| [options.filename] | <code>string</code> | Provide filename |
| [options.contentType] | <code>string</code> | Provide content-type for download |
| [options.knownLength] | <code>number</code> | Provide stream total length if available |

<a name="Namespace+uploadFromLocal"></a>

### namespace.uploadFromLocal(filePath) ⇒ <code>Promise</code>
Upload a file from local file-system

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Fulfil**: <code>object</code> File info when uploading is finished

```javascript
{
  id: string   // Uploaded file id
  md5: string  // The MD5 hash of the file
  size: number // The total size of the file
}
```  
**Reject**: <code>any</code> Request error  

| Param | Type | Description |
| --- | --- | --- |
| filePath | <code>string</code> | The path of file will be uploaded |

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
**Reject**: <code>any</code> When a error occur  

| Param | Type | Description |
| --- | --- | --- |
| fileId | <code>FileId</code> | The file id, see [FileId](#Namespace..FileId) |
| filePath | <code>string</code> | The path of file will be saved |
| [options] | <code>RequestOptions</code> | Additional options, see [RequestOptions](#Namespace..RequestOptions) |

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

<a name="Namespace..FileId"></a>

### Namespace~FileId : <code>string</code>
File identifier

**Kind**: inner typedef of [<code>Namespace</code>](#Namespace)  
**Example**  
```js
Example file id: `e5ac71cf-a0f0-46b5-9070-268ae97bb769`
```

* * *

## License

MIT © NexusDocs
