import { MongoClient } from 'mongodb';

const defaultUrl = 'mongodb://localhost:27017/nexusdocs';

export let db;

export async function connect(url = defaultUrl) {
  if (!db) {
    db = await MongoClient.connect(url);
    await db.collection('docs.files.store').ensureIndex({namespace: 1, md5: 1}, {unique: 1});
  }
  return db;
}
