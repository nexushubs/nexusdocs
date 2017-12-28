# NexusDocs

NexusDocs is designed for applications to use multiple cloud storage engine in single API, switching one to another without worrying about different SDK boundaries. NexusDocs is first developed for our internal application, bridging several deployments of one applications for different customers, who required to use different cloud storage engine, even in the same application. We want to share it for the internet as someone would come across the same problem, finally we can control storage engines in one kick.

[Documentation](https://github.com/nexushubs/nexusdocs/wiki)

## Packages

| Package | Version | Docs | Description |
|---------|---------|------|-------------|
| [`nexusdocs-server`](/packages/nexusdocs-server) | 0.1.0 | [server docs](/packages/nexusdocs-server/README.md) | NexusDocs Server |
| [`nexusdocs-client`](/packages/nexusdocs-client) | 0.1.0 | [client docs](/packages/nexusdocs-client/README.md) | Client SDK |

## Currently Supported Storage Provider

* Local storage
  * [MongoDB GridFS](https://docs.mongodb.com/manual/core/gridfs/)
* Cloud storage
  * [Aliyun OSS](https://www.alibabacloud.com/product/oss)

----
## License

[MIT](./LICENSE)
