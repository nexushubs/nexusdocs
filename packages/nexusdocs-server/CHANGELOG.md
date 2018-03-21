# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.2.11] - 2018-03-21

### Added

- new api for creating & download archive:
  ```
  /namespaces/:namespace/archive?files=[<fileId1>,<fileId2>...]&filename=<filename>
  ```
  This will save time for the user (no need to create a archive file in the storage) and save
  database space for the server, especially large files.
