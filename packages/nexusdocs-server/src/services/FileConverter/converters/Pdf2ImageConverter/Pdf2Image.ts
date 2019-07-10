import * as _ from 'lodash';
import * as FormData from 'form-data';
import * as request from 'request';
import { MqttClient, connect } from 'mqtt';

import HttpClient, { ContentTypes, HttpClientOptions } from '../../../../lib/HttpClient';
import { Readable, PassThrough } from 'stream';
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

interface ConstructorOptions {
  url?: string;
  mqtt?: string;
}

class Pdf2Image extends Base {

  public options: ConstructorOptions;
  private mqtt: MqttClient;
  private client: HttpClient;

  constructor(options: ConstructorOptions = {}) {
    super();
    this.options = options;
  }

  async init() {
    const { url, mqtt } = this.options;
    this.client = new HttpClient(url);
    return new Promise((resolve, reject) => {
      const mqttClient = connect(mqtt);
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
    form.append('files', file, options);
    const result = await this.client.post<JobResult>('/pdf2image', form);
    const [status] = result.result.files;
    const newStatus = await this.getResult(status._id);
    return newStatus;  
  }

  getPage(status: JobStatus, page: number): Readable {
    const url = `${this.options.url}/converted/${status._id}/${page}.png`;
    const stream = new PassThrough;
    request(url).pipe(stream);
    return stream;
  }

}

export default Pdf2Image;
