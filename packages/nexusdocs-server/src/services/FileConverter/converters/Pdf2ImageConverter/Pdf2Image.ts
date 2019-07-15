import * as _ from 'lodash';
import * as FormData from 'form-data';
import fetch from 'node-fetch';
import { MqttClient, connect } from 'mqtt';
import getStream = require('get-stream');

import HttpClient from '../../../../lib/HttpClient';
import { Readable } from 'stream';
import Base from '../../../../lib/Base';

export interface Pdf2ImageConvertingOptions extends FormData.AppendOptions {
}

export interface JobStatus {
  createdAt: number;
  status: string;
  downloadUrl: string;
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: string;
  pageCount: string;
  _id: string;
}

export interface JobResult {
  result: {
    files: JobStatus[];
  }
};

export interface ServerOptions {
  url?: string;
  mqtt?: string;
}

class Pdf2Image extends Base {

  public options: ServerOptions;
  private mqtt: MqttClient;
  private client: HttpClient;

  constructor(options: ServerOptions = {}) {
    super();
    this.options = options;
  }

  async init() {
    const { url, mqtt } = this.options;
    this.client = new HttpClient(url);
    console.log(`# initializing pdf2image client ${url}`);
    console.log(`# mqtt = ${mqtt}`);
    return new Promise((resolve, reject) => {
      const mqttClient = connect(mqtt);
      mqttClient.on('error', console.error);
      mqttClient.on('connect', () => {
        console.log(`# Pdf2Image: mqtt connected to ${this.options.mqtt}`);
        mqttClient.subscribe('converted', err => {
          if (err) {
            console.error(`# Pdf2Image: error subscribing converting status`);
            reject(err);
          } else {
            console.log(`# Pdf2Image: successfully subscribed topic 'converted'`);
            resolve();
          }
        });
      });
      mqttClient.on('message', (topic, message) => {
        if (topic === 'converted') {
          try {
            const status = JSON.parse(message.toString()) as JobStatus;
            this.processResult(status);
          } catch (err) {
            this.emit('error', err);
          }
        }
      })
      this.mqtt = mqttClient;
    });
  }

  async processResult(status: JobStatus) {
    const { _id } = status;
    this.emit(`finish-${_id}`, status);
  }

  getResult(_id: string): Promise<JobStatus> {
    return new Promise((resolve, reject) => {
      this.once(`finish-${_id}`, resolve);
    });
  }

  async convert(file: Buffer | Readable, options: Pdf2ImageConvertingOptions = {}) {
    const form = new FormData;
    const buffer: Buffer = Buffer.isBuffer(file) ? file : await getStream.buffer(file as Readable);
    form.append('files', buffer, options);
    const result = await this.client.post<JobResult>('/api/v1/pdf2image', form);
    const files = _.get(result, 'result.files');
    const [status] = files;
    const newStatus = await this.getResult(status._id);
    return newStatus;
  }

  async getPage(status: JobStatus, page: number): Promise<Readable> {
    const url = `${this.options.url}${status.downloadUrl}/${page}.png`;
    const res = await fetch(url);
    return res.body as any;
  }

}

export default Pdf2Image;
