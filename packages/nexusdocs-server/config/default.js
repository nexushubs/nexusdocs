module.exports = {
  Application: {
    database: 'mongodb://localhost:27017/nexusdocs',
    restful: {
      enabled: true,
      hostname: '127.0.0.1',
      port: 4000,
      trustedProxy: '127.0.0.1',
      serverUrl: '',
    },
    debug: {
      request: true,
    }
  },
  services: {
    Elasticsearch: {
      host: '127.0.0.1',
      port: '9200',
    },
    FileCache: {
      clearOnStartup: true,
    },
    FileParser: {
      parsers: {
        ImageThumbParser: {
          disabled: true,
          thumbSize: 48,
        },
        TextParser: {
          maxLength: 5 * 1024 * 1024,
        },
        ZipParser: {
          disabled: true,
        },
        TextParser: {
          disabled: true,
        },
      },
    },
    FileConverter: {
      converters: {
        ImageGMConverter: {
          disabled: true,
        },
        DocumentConverter: {
          unoconvServerURL: 'http://127.0.0.1:5000',
        },
      }
    }
  },
};
