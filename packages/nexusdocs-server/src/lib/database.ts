
import { MongoClient, Db } from 'mongodb';

let client: MongoClient = null;

export async function connect(url: string) {
  if (!client) {
    client = await MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  return client;
}
