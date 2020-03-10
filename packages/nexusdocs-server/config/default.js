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
      enabled: true,
      host: '127.0.0.1',
      port: '9200',
    },
    FileCache: {
      enabled: true,
      clearOnStartup: true,
    },
    FileParser: {
      enabled: true,
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
      enabled: true,
      converters: {
        ImageGMConverter: {
          disabled: true,
        },
        UnoconvConverter: {
          unoconvServerUrl: 'http://127.0.0.1:5000',
        },
        PandocConverter: {
          pandocApiUrl: 'http://127.0.0.1:6000',
        },
        Pdf2ImageConverter: {
          url: '',
          mqtt: '',
        },
      }
    }
  },
};
