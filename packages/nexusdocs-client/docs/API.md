## Modules

<dl>
<dt><a href="#module_nexusdocs-client">nexusdocs-client</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#Client">Client</a></dt>
<dd><p>Class presenting NexusDocs client instance</p></dd>
<dt><a href="#Namespace">Namespace</a></dt>
<dd><p>Class presenting NexusDocs namespace instance</p></dd>
<dt><a href="#Signer">Signer</a></dt>
<dd><p>Class for signing request</p></dd>
</dl>

<a name="module_nexusdocs-client"></a>

## nexusdocs-client
<a name="module_nexusdocs-client..createClient"></a>

### nexusdocs-client~createClient()
<p>Create a NexusDocs client instance</p>

**Kind**: inner method of [<code>nexusdocs-client</code>](#module_nexusdocs-client)  
**See**: <p><a href="#new_Client_new">new Client()</a></p>  
**Example**  
Create a client (es module)

```javascript
   import { Client } from 'nexusdocs-client';
   
   // Object style server options:
   const client = new Client({
     hostname: '192.168.1.6',
     port: 4001,
     apiKey: 'MY_API_KEY',
     apiSecret: 'MY_API_SECRET',
   });
   
   // URL style server options:
   const client = new Client('http://MY_API_KEY:MY_API_SECRET@192.168.1.6:4001/api');
   ```
<a name="Client"></a>

## Client
<p>Class presenting NexusDocs client instance</p>

**Kind**: global class  

* [Client](#Client)
    * [new Client(options)](#new_Client_new)
    * [.requestAsStream(options)](#Client+requestAsStream)
    * [.request(options)](#Client+request) ⇒
    * [.getNamespace(name, options)](#Client+getNamespace) ⇒

<a name="new_Client_new"></a>

### new Client(options)
<p>Creates an instance of NDS Client.</p>


| Param | Description |
| --- | --- |
| options | <p>Server options</p> |

**Example**  
You can pass a URL sting instead of a config object:
```xml
http://<clientKey>:<clientSecret>@<hostname>:<port><endPoint>
```
<a name="Client+requestAsStream"></a>

### client.requestAsStream(options)
<p>Request NDS server and return a stream like object</p>

**Kind**: instance method of [<code>Client</code>](#Client)  
**Access**: protected  

| Param |
| --- |
| options | 

<a name="Client+request"></a>

### client.request(options) ⇒
<p>Request NDS and return a Promise</p>

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: <p>Promise of request result</p>  

| Param | Description |
| --- | --- |
| options | <p>See <a href="#Namespace..RequestOptions">Namespace~RequestOptions</a></p> |

<a name="Client+getNamespace"></a>

### client.getNamespace(name, options) ⇒
<p>Get namespace instance</p>

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: <p>Namespace instance</p>  

| Param | Description |
| --- | --- |
| name | <p>The name</p> |
| options | <p>Additional options</p> |

<a name="Namespace"></a>

## Namespace
<p>Class presenting NexusDocs namespace instance</p>

**Kind**: global class  

* [Namespace](#Namespace)
    * [new Namespace(client, name, options)](#new_Namespace_new)
    * [.getUploadUrl(options)](#Namespace+getUploadUrl) ⇒
    * [.getDownloadUrl(fileId, options)](#Namespace+getDownloadUrl) ⇒
    * [.getConvertedUrl(fileId, converting, options)](#Namespace+getConvertedUrl) ⇒
    * [.upload(data, options)](#Namespace+upload) ⇒
    * [.openUploadStream(options)](#Namespace+openUploadStream) ⇒
    * [.uploadFromLocal(filePath, options)](#Namespace+uploadFromLocal) ⇒
    * [.openDownloadStream(fileId, options)](#Namespace+openDownloadStream) ⇒
    * [.downloadToLocal(fileId, filePath, options)](#Namespace+downloadToLocal) ⇒
    * [.getFileInfo(fileId)](#Namespace+getFileInfo) ⇒
    * [.delete(fileId)](#Namespace+delete) ⇒
    * [.truncate()](#Namespace+truncate)
    * [.createArchive(files)](#Namespace+createArchive)
    * [.getArchiveUrl(files, options)](#Namespace+getArchiveUrl)
    * [.searchSimilarDoc(fileId)](#Namespace+searchSimilarDoc)

<a name="new_Namespace_new"></a>

### new Namespace(client, name, options)
<p>Namespace Class constructor</p>


| Param | Description |
| --- | --- |
| client | <p>NDS Client instance</p> |
| name | <p>The name of namespace</p> |
| options |  |

**Example**  
Create a namespace instance

```javascript
const namespace = client.getNamespace('a.name.space');
```
<a name="Namespace+getUploadUrl"></a>

### namespace.getUploadUrl(options) ⇒
<p>Get URL for upload</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <p>URL for upload</p>  

| Param | Description |
| --- | --- |
| options | <p>Additional options</p> |

<a name="Namespace+getDownloadUrl"></a>

### namespace.getDownloadUrl(fileId, options) ⇒
<p>Get file URL for view or download</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <p>file URL</p>  

| Param | Description |
| --- | --- |
| fileId | <p>File identifier</p> |
| options | <p>Additional options</p> |

<a name="Namespace+getConvertedUrl"></a>

### namespace.getConvertedUrl(fileId, converting, options) ⇒
<p>Get the converted file URL for view or download</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <p>The converted file URL</p>  

| Param | Description |
| --- | --- |
| fileId | <p>File identifier</p> |
| converting | <p>Converting options</p> |
| options | <p>Additional options</p> |

<a name="Namespace+upload"></a>

### namespace.upload(data, options) ⇒
<p>Upload file from Buffer, ReadableStream</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <p>Promise of uploading request</p>  

| Param | Description |
| --- | --- |
| data | <p>File data</p> |
| options | <p>Additional options</p> |

<a name="Namespace+openUploadStream"></a>

### namespace.openUploadStream(options) ⇒
<p>Get upload stream</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <p>A writable stream for upload</p>  

| Param | Description |
| --- | --- |
| options | <p>Additional options</p> |

<a name="Namespace+uploadFromLocal"></a>

### namespace.uploadFromLocal(filePath, options) ⇒
<p>Upload a file from local file-system</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <p>Promise of uploading request</p>  

| Param | Description |
| --- | --- |
| filePath | <p>The path of file will be uploaded</p> |
| options | <p>Upload options</p> |

<a name="Namespace+openDownloadStream"></a>

### namespace.openDownloadStream(fileId, options) ⇒
<p>Get a readable stream for download</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <p>the readable stream</p>  

| Param | Description |
| --- | --- |
| fileId | <p>The file needed to download later</p> |
| options | <p>Additional options</p> |

<a name="Namespace+downloadToLocal"></a>

### namespace.downloadToLocal(fileId, filePath, options) ⇒
<p>Download a file to local file-system</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <p>Promise of downloading request</p>  

| Param | Description |
| --- | --- |
| fileId | <p>The file id</p> |
| filePath | <p>The path of file will be saved</p> |
| options | <p>Additional options</p> |

<a name="Namespace+getFileInfo"></a>

### namespace.getFileInfo(fileId) ⇒
<p>Get file information</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <p>Promise of file info</p>  

| Param |
| --- |
| fileId | 

<a name="Namespace+delete"></a>

### namespace.delete(fileId) ⇒
<p>Delete a file on the server</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
**Returns**: <p>Promise of deleting request</p>  

| Param | Description |
| --- | --- |
| fileId | <p>The file to be deleted</p> |

<a name="Namespace+truncate"></a>

### namespace.truncate()
<p>Delete all files in this namespace</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  
<a name="Namespace+createArchive"></a>

### namespace.createArchive(files)
<p>Create an archive</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  

| Param | Description |
| --- | --- |
| files | <p>file id array</p> |

<a name="Namespace+getArchiveUrl"></a>

### namespace.getArchiveUrl(files, options)
<p>Archive files then return download URL</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  

| Param | Description |
| --- | --- |
| files | <p>file id array</p> |
| options | <p>RequestOptions</p> |

<a name="Namespace+searchSimilarDoc"></a>

### namespace.searchSimilarDoc(fileId)
<p>Search similar doc of specified file</p>

**Kind**: instance method of [<code>Namespace</code>](#Namespace)  

| Param |
| --- |
| fileId | 

<a name="Signer"></a>

## Signer
<p>Class for signing request</p>

**Kind**: global class  

* [Signer](#Signer)
    * [.signUrl()](#Signer+signUrl)
    * [.signRequest()](#Signer+signRequest)

<a name="Signer+signUrl"></a>

### signer.signUrl()
<p>Sign a URL for secured request</p>

**Kind**: instance method of [<code>Signer</code>](#Signer)  
<a name="Signer+signRequest"></a>

### signer.signRequest()
<p>Sign a request with body</p>

**Kind**: instance method of [<code>Signer</code>](#Signer)  
