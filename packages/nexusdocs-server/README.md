# nexusdocs-server

NexusDocs server application

[NexusDocs Documentation](https://github.com/nexushubs/nexusdocs/wiki)

## Install

```bash
npm install nexushubs-server
```

## Quick Start

### Standalone Service

```bash
npm start
```

### Start in Main Application

```javascript
const createServer = require('nexusdocs-server');

const server = createServer({
  hostname: '<hostname>',     // default 127.0.0.1
  port: '<port>',             // default 4000
  database: '<mongo-url>',    // default mongodb://127.0.0.1/nexusdocs
});

server.start();
```

## Config by Environment Variables

| Env | Description |
| --- | ----------- |
| `NDS_DATABASE` | Mongodb database URL |
| `NDS_RESTFUL_ENABLED` | Whether to start API Server |
| `NDS_RESTFUL_HOSTNAME` | API Server bind hostname |
| `NDS_RESTFUL_PORT` | API Server bind port |

## Command Line Tool

```base
$ ./ndstool --help

  Usage: ndstool [options] [command]


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    provider [command]   manage provider
    namespace [command]  namespace provider
    client [command]     client manage
    help [cmd]           display help for [cmd]
```

## License

> MIT
