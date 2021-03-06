# nexusdocs-server

NexusDocs server application

[NexusDocs Documentation](https://github.com/nexushubs/nexusdocs/wiki)

User Documentation

* User Guides
  * [Namespace](./docs/guides/namespace.md)
  * [Provider](./docs/guides/provider.md)

## Install

### Install as npm package:

```bash
yarn add nexushubs-server
```

### Install from source code:

```bash
git clone https://github.com/nexushubs/nexusdocs.git
cd packages/nexusdocs-server
yarn
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

```nginx
server {
  listen 80;
  server_name storage.example.com;
  #...
  location /api/nexusdocs {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
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

| Env                         | Default                               | Description                                                                      |
| --------------------------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| `NDS_DATABASE`              | `mongodb://127.0.0.1:27017/nexusdocs` | Mongodb database URL                                                             |
| `ELASTICSEARCH_HOST`        | `127.0.0.1`                           | Mongodb database URL                                                             |
| `ELASTICSEARCH_PORT`        | `9200`                                | Mongodb database URL                                                             |
| `NDS_RESTFUL_ENABLED`       | `true`                                | Whether to start API Server                                                      |
| `NDS_RESTFUL_HOSTNAME`      | `127.0.0.1`                           | API Server bind hostname                                                         |
| `NDS_RESTFUL_PORT`          | `4000`                                | API Server bind port                                                             |
| `NDS_RESTFUL_TRUSTED_PROXY` | `127.0.0.1`                           | Trusted Proxy, see http://expressjs.com/en/4x/api.html#trust.proxy.options.table |
| `NDS_RESTFUL_SERVER_URL`    | `N/A`                                 | Custom server url, default to ''                                                 |
| `NDS_DEBUG_REQUEST`         | `true`                                | Switch whether to debug HTTP requests                                            |

For more environment config, see [custom-environment-variables.js](./config/custom-environment-variables.js)

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

* `elasticsearch` for searching file meta info
* `unoconv` for converting office document
* `mongo` build-in mongodb server, you can replace to your own
* `nds` NexusDocs server, with full run-time code

## Start Server

```bash
$ docker-compose up -d
Creating nexusdocsserver_unoconv_1 ... done
Creating nexusdocsserver_mongo_1   ... done
Creating nexusdocsserver_nds_1     ... done
```

Or use build-in script

```bash
# start docker containers stack with full services
$ ./start docker 
# start docker main container, dependency services should set in .env
$ ./start docker --standalone
# start nodejs server, dependency services should pass by environment variables or config file
$ ./start
```

## Install the Default Data

```
$ ./ndstool install
```

Call ndstool inside docker container:

```
$ ./ndstool docker install
```

## Checking Server Logs

```
$ docker-compose logs --follow nds
```

## License

> [MIT](./LICENSE)
