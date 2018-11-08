import { EventEmitter } from "events";
import { Db, MongoClient } from "mongodb";
import Application from "./Application";
import { IModels } from "models/types";
import { IServices } from "services/types";

const models: IModels = {}
const services: IServices = {}
let app: Application = null
let db: Db = null
let dbClient: MongoClient = null

export default class Base extends EventEmitter {

  get models() {
    return models;
  }

  get services() {
    return services;
  }

  get app() {
    return app;
  }

  set app(value) {
    app = value;
  }

  get db() {
    return db;
  }

  set db(value) {
    db = value;
  }

  get dbClient() {
    return dbClient;
  }

  set dbClient(value) {
    dbClient = value;
  }

}
