# NexusDocs

NexusDocs Server is a storage engine designed for storing public and private files, providing simple
RESTful API to manage. By written in modern javascript (by the power of Babel) and packed with the
popular framework [express](https://github.com/expressjs/express), we can take the advantage of
async coding and good concurrent performance.

NexusDocs can be used stand-alone or a proxy to multiple popular cloud storage service,
This could be very helpful when you are going to store files in different cloud service.

It is also integrated with utilities for generating image thumbnail (by high performance image
processing tool [sharp](https://github.com/lovell/sharp)), or converting document files into PDF
(by [unoconv](https://github.com/dagwieers/unoconv)).

## Docs

[Documentation](https://github.com/nexushubs/nexusdocs/wiki)

## Packages

This repository is a monorepo that we manage using Lerna. That means that we actually publish several packages to npm from the same codebase, including:

| Package | Version | Docs | Description |
|---------|---------|------|-------------|
| [`nexusdocs-server`](/packages/nexusdocs-server) | [![npm](https://img.shields.io/npm/v/nexusdocs-server.svg)](https://www.npmjs.com/package/nexusdocs-server) | [![Server Doc](https://img.shields.io/badge/Server%20Doc-markdown-lightgrey.svg)](./packages/nexusdocs-server/README.md) | NexusDocs Server |
| [`nexusdocs-client`](/packages/nexusdocs-client) | [![npm](https://img.shields.io/npm/v/nexusdocs-client.svg)](https://www.npmjs.com/package/nexusdocs-client) | [![API Doc](https://img.shields.io/badge/API%20Doc-markdown-lightgrey.svg)](./packages/nexusdocs-client/README.md) | API Client SDK |

## Features

* [X] Providing uploading, downloading, viewing, searching, deletion operation of file (downloading and viewing will be redirected to provider URI).
* [X] Managing different type of files by namespaces, each namespace can be associated to its own provider and bucket.
* [X] File is uploading to NexusDocs, and then to the specified provider storage.
* [X] When client is requesting an resource for, NexusDocs checks authority, and then redirecting to safe URI.
* [X] Providing useful file format converting service, e.g. .doc to .pdf；
* [ ] Stores file history versions (to be done in latest future).
* [ ] Batch upload, download (supporting .zip, .rar, .tar.gz).
* [ ] Creating and snapshot and later restore from it, need not worry about data loss.
* [ ] Copying and moving files between different namespaces.
* [ ] Extracting attachment from a email body, useful for auto file receiving feature.

## Currently Supported Storage Drivers

| Provider | Driver | Description |
| -------- | ------ | ----------- |
| gridfs | [mongodb](http://mongodb.github.io/node-mongodb-native/2.2/) | Internel used [GridFS](https://docs.mongodb.com/manual/core/gridfs/) provider |
| alioss | [ali-oss](https://github.com/ali-sdk/ali-oss) | The [Aliyun OSS](https://docs.aliyun.com/en#/pub/oss_en_us/quick-start/get-started) provider |

----
## License

[MIT](./LICENSE)
