module.exports = {
  Application: {
    database: 'mongodb://localhost:27017/nexusdocs',
    restful: {
      enabled: true,
      hostname: '127.0.0.1',
      port: 4000,
    },
  },
  services: {
    FileCache: {
      clearOnStartup: true,
    },
    FileParser: {
      parsers: {
        ImageThumbParser: {
          thumbSize: 48,
        },
      },
    },
    FileConverter: {
      converters: {
        ImageGMConverter: {
          disabled: true,
        },
        DocumentConverter: {
          uniconvServerURL: 'http://127.0.0.1:5000',
        },
      }
    }
  },
};
