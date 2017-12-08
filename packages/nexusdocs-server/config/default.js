module.exports = {
  service: {
    hostname: '127.0.0.1',
    port: 4000,
    database: 'mongodb://localhost:27017/nexusdocs',
    cli: false,
  },
  cli: {
    database: 'mongodb://localhost:27017/nexusdocs',
    cli: true,
  }
};
