const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const nock = require('nock');
const uuid = require('uuid');
const contentDisposition = require('content-disposition');

const { encodeRFC5987ValueChars } = require('./util');
const createClient = require('../lib');

describe('File uploading and downloading', () => {

  const serverUrl = 'http://127.0.0.1:4000';
  const apiUrl = `${serverUrl}/api`;
  const ns = 'ns.a';
  const fileId = uuid.v4();
  const testFile = `${__dirname}/test.txt`;
  const client = createClient(apiUrl);
  const namespace = client.getNamespace(ns);

  beforeEach(() => {
    const api = nock(serverUrl)

    api.post(`/api/namespaces/${ns}/upload`)
      // .delay(500)
      .reply(200, { files_id: fileId });
    
    api.get(`/api/namespaces/${ns}/files/${fileId}`)
      // .delay(500)
      .reply(200, (uri, requestBody) => {
        return fs.createReadStream(testFile);
      });
  });

  describe('Uploading', () => {
    
    it('get upload url', () => {
      const url = namespace.getUploadUrl();
      const expectedUrl = `${apiUrl}/namespaces/${ns}/upload`;
      expect(url).to.equal(expectedUrl);
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
      expect(url).to.equal(expectedUrl);
    });
    
    it('get download url with filename', () => {
      const filename = '测试文件.docx';
      const url = namespace.getDownloadUrl(fileId, { filename });
      const expectedUrl = `${apiUrl}/namespaces/${ns}/files/${fileId}?response-content-disposition=${encodeRFC5987ValueChars(contentDisposition(filename))}`;
      expect(url).to.equal(expectedUrl);
    });

    it('download file as stream', done => {
      const fileContent = fs.readFileSync(testFile, { encoding: 'utf8' });
      let content = '';
      const downloadStream = namespace.openDownloadStream(fileId)
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
