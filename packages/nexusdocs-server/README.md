# nexusdocs-server

NexusDocs server application

[NexusDocs Documentation](https://github.com/nexushubs/nexusdocs/wiki)

## Install

### Install as npm package:

```bash
npm install nexushubs-server
```

### Install from source code:

```bash
git clone https://github.com/nexushubs/nexusdocs.git
cd packages/nexusdocs-server
npm install
```

### Install default data:

```bash
./ndstool install
```

### Creating connection URI for client

```bash
./ndstool client create-url user
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

## Behind nginx

```conf
server {
  listen 80;
  server_name storage.example.com;
  #...
  location /api/nexusdocs {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Scheme $scheme;
    proxy_set_header X-Original-URI $request_uri;
    proxy_pass http://127.0.0.1:4000/api;
    proxy_http_version 1.1;
  }
  #...
}
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

    install              install default data
    env                  manage .env config
    provider [command]   manage provider
    namespace [command]  namespace provider
    client [command]     client manage
    help [cmd]           display help for [cmd]
```

# Playing with Docker

The build-in [docker-compose.yml](./docker-compose.yml) starts 3 containers:

* `unoconv` for converting office document
* `mongo` build-in mongodb server, you can replace to your own
* `nds` NexusDocs server, with full run-time code

## Start Server

```
$ docker-compose up -d
Creating nexusdocsserver_unoconv_1 ... done
Creating nexusdocsserver_mongo_1   ... done
Creating nexusdocsserver_nds_1     ... done
```

## Install the Default Data

```
$ docker-compose exec nds /bin/sh
/usr/src/app # ndstool install
```

## Checking Server Logs
```
$ docker-compose logs --follow nds
```

## License

> MIT
