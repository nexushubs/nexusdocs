# Resumable Upload Cache Service

This service together with `api/routes/files.js` implement
[Resumable.js](https://github.com/23/resumable.js) protocol on the server side.

In order to support resumable upload for NexusDocs, this service provides a pre-upload cache
when a file is partially uploaded (some of the resumable chunks), after all chunks are uploaded,
We can then transfer the final combined stream to NexusDocs storage.

See node example of resumable.js: https://github.com/23/resumable.js/tree/master/samples/Node.js

## Limits

Currently, the service uses file-system as cache, considered co-current request, checking file
status frequently on file-system may have misbehaver.
