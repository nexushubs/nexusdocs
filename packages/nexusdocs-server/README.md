# nexusdocs-server

NexusDocs server application

[NexusDocs Documentation](https://github.com/nexushubs/nexusdocs/wiki)

## Use

```bash
npm install nexushubs-server
```

app.js

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
| `NDS_HOSTNAME` | Server bind hostname |
| `NDS_PORT` | Server bind port |
| `NDS_DATABASE` | Mongodb database URL |

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
