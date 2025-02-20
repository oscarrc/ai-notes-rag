import * as lancedb from '@lancedb/lancedb';
import {
  Schema,
  Field,
  FixedSizeList,
  Int32,
  Float32,
  Utf8,
} from 'apache-arrow';
import path from 'path';

const DATA_PATH = process.env.NEXT_PUBLIC_DATA_PATH || 'data';
const DB = process.env.NEXT_NEXT_PUBLIC_DB_PATH || '/database';
const EMBEDDING_DIMENSION = 384;

const embeddingsSchema = new Schema([
  new Field('name', new Utf8()),
  new Field('path', new Utf8()),
  new Field('text', new Utf8()),
  new Field(
    'vector',
    new FixedSizeList(
      EMBEDDING_DIMENSION,
      new Field('item', new Float32(), true)
    ),
    false
  ),
]);

export const connectDB = async () => {
  const dbDir = path.join(process.cwd(), DATA_PATH, DB);
  const db = await lancedb.connect(dbDir);
  return db;
};

export const getTable = async (db: any, tableName: string) => {
  const tableNames = await db.tableNames();

  try {
    if (tableNames.includes[tableName]) {
      return await db.openTable(tableName);
    }

    return await db.createEmptyTable(tableName, embeddingsSchema, {
      existOk: true,
    });
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
};
