
import { MongoClient, Db } from 'mongodb';

let client: MongoClient = null;

export async function connect(url) {
  if (!client) {
    client = await MongoClient.connect(url, { useNewUrlParser: true });
  }
  return client;
}
