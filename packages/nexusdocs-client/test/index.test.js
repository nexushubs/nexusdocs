const fs = require('fs');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const uuid = require('uuid');
const mime = require('mime-types');
const contentDisposition = require('content-disposition');

const { expect } = chai;
chai.use(chaiAsPromised);
const { encodeRFC5987ValueChars } = require('./util');
const createClient = require('../lib');

function normalizeUrl(url) {
  return url.replace(/(&|\?)(e=\d+|token=[\.\w\-_]+)/g, '');
}

describe('File uploading and downloading', () => {

  const serverUrl = 'http://127.0.0.1:4000';
  const apiUrl = `${serverUrl}/api`;
  const ns = 'ns.a';
  const fileId = uuid.v4();
  const fileIdBadBody = 'bad-body';
  const fileIdMissing = 'missing-file';
  const fileIdServerError = 'server-error';
  const testFile = `${__dirname}/test.txt`;
  const client = createClient(apiUrl);
  const namespace = client.getNamespace(ns);

  beforeEach(() => {
    const api = nock(serverUrl);

    api.post(`/api/namespaces/${ns}/upload`)
      .reply(200, { files_id: fileId });
    
    api.get(new RegExp(`\/api\/namespaces\/${ns}\/files\/${fileId}.+`))
      .reply(200, (uri, requestBody) => {
        return fs.createReadStream(testFile);
      });
  
    // Fake Good response
    api.get(`/api/namespaces/${ns}/files/${fileId}/info`)
      .reply(200, { files_id: fileId });
  
    // Fake 200 bad response
    api.get(`/api/namespaces/${ns}/files/${fileIdBadBody}/info`)
      .reply(200, 'This is not JSON');
  
    // Fake 400 response
    api.get(`/api/namespaces/${ns}/files/${fileIdMissing}/info`)
      .reply(404, { files_id: fileId });
  
    // Fake 500 response
    api.get(`/api/namespaces/${ns}/files/${fileIdServerError}/info`)
      .reply(200, 'Internal Server Error');
      
  });

  describe('Init Options', () => {
    
    it('parse http string option', () => {
      const url = 'http://key:secret@192.168.1.100:8080/custom/api';
      const client = createClient(url);
      const expectedUrl = `${apiUrl}/namespaces/${ns}/upload`;
      expect(client.options).to.deep.equal({
        hostname: '192.168.1.100',
        secure: false,
        port: 8080,
        endPoint: '/custom/api',
        clientKey: 'key',
        clientSecret: 'secret',
        defaultUrlExpires: 3600,
        defaultRequestExpires: 60,
      });
    });
    
    it('parse https string option', () => {
      const url = 'https://key:secret@192.168.1.100:443/custom/api';
      const client = createClient(url);
      const expectedUrl = `${apiUrl}/namespaces/${ns}/upload`;
      expect(client.options).to.deep.equal({
        hostname: '192.168.1.100',
        secure: true,
        port: 443,
        endPoint: '/custom/api',
        clientKey: 'key',
        clientSecret: 'secret',
        defaultUrlExpires: 3600,
        defaultRequestExpires: 60,
      });
    });

  });

  describe('Uploading', () => {
    
    it('get upload url', () => {
      const url = namespace.getUploadUrl();
      const expectedUrl = `${apiUrl}/namespaces/${ns}/upload`;
      expect(normalizeUrl(url)).to.equal(expectedUrl);
    });

    it('upload file as stream', done => {
      const options = {
        fileName: '123.txt',
        contentType: 'text/plain'
      };
      const uploadStream = namespace.openUploadStream(options);
      const fileStream = fs.createReadStream(testFile);
      fileStream.pipe(uploadStream)
      uploadStream.on('file', file => {
        done(file.files_id != fileId);
      });
      uploadStream.on('error', done);
    });

    it('upload from local file', done => {
      const uploadStream = namespace.uploadFromLocal(testFile)
      .then(file => {
        done(file.files_id != fileId);
      })
      .catch(done);
    });

  });

  describe('Downloading', () => {
    
    it('get download url', () => {
      const url = namespace.getDownloadUrl(fileId);
      const expectedUrl = `${apiUrl}/namespaces/${ns}/files/${fileId}`;
      expect(normalizeUrl(url)).to.equal(expectedUrl);
    });
    
    it('get download url with filename', () => {
      const filename = '测试文件.docx';
      const url = namespace.getDownloadUrl(fileId, { filename });
      const expectedUrl = `${apiUrl}/namespaces/${ns}/files/${fileId}?response-content-type=${encodeURIComponent(mime.contentType(filename))}&response-content-disposition=${encodeRFC5987ValueChars(contentDisposition(filename))}`;
      expect(normalizeUrl(url)).to.equal(expectedUrl);
    });

    it('download file as stream', done => {
      const fileContent = fs.readFileSync(testFile, { encoding: 'utf8' });
      let content = '';
      namespace.openDownloadStream(fileId).then(downloadStream => {
        downloadStream.on('data', data => {
          content += data;
        })
        downloadStream.on('end', () => {
          expect(content).to.equal(fileContent.toString('utf8'));
          done();
        })
        downloadStream.on('error', done);
      });
    });
    
  });

  describe('Result Parsing', () => {
    
    it('get file info 200', () => {
      const infoPromise = namespace.getFileInfo(fileId);
      expect(infoPromise).to.be.eventually.have.property('files_id', fileId);
    });
    
    it('get file info 200 with bad response', () => {
      const infoPromise = namespace.getFileInfo(fileIdBadBody);
      expect(infoPromise).to.be.eventually.rejectedWith(Error);
    });
    
    it('get file info 404', () => {
      const infoPromise = namespace.getFileInfo(fileIdMissing);
      expect(infoPromise).to.be.eventually.rejectedWith(Error);
    });
    
    it('get file info 500', () => {
      const infoPromise = namespace.getFileInfo(fileIdServerError);
      expect(infoPromise).to.be.eventually.rejectedWith(Error);
    });

  });

});
