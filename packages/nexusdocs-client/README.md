# nexusdocs-client

Client-SDK for [nexusdocs-server](https://github.com/nexushubs/nexusdocs/tree/master/packages/nexusdocs-server)

[NexusDocs Documentation](https://github.com/nexushubs/nexusdocs/wiki)

## Install

```bash
yarn add nexusdocs-client
```

## Usage

```js
import createClient from 'nexusdocs-client';

// Object style server options:
const client = createClient({
  hostname: '192.168.1.6',
  port: 4001,
  apiKey: 'MY_API_KEY',
  apiSecret: 'MY_API_SECRET',
});

// URL style server options:
const client = createClient('http://MY_API_KEY:MY_API_SECRET@192.168.1.6:4001/api');
```

Check [API Documentation](https://github.com/nexushubs/nexusdocs/tree/master/packages/nexusdocs-client/docs/API.md) for more detail

## License

MIT
