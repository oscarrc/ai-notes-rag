import * as lancedb from '@lancedb/lancedb';

import {
  Field,
  FixedSizeList,
  Float32,
  Schema,
  Utf8,
} from 'apache-arrow';

import path from 'path';

const DATA_PATH = process.env.NEXT_PUBLIC_DATA_PATH || 'data';
const DB = process.env.NEXT_NEXT_PUBLIC_DB_PATH || '/database';
const EMBEDDING_DIMENSION = 384;

const embeddingsSchema = new Schema([
  new Field('name', new Utf8()),
  new Field('path', new Utf8()),
  new Field('content', new Utf8()),
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
    if (tableNames.includes(tableName)) {
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

export const updateEmbeddingPaths = async (pathMapping: { from: string; to: string }) => {
  try {
    const db = await connectDB();
    const table = await getTable(db, 'embeddings');
    
    // Find all records where path starts with the old path prefix
    const records = await table.filter(
      `path LIKE "${pathMapping.from}%"`
    ).toArray();
    
    if (records && records.length > 0) {
      // First, delete all records with the old path prefix to avoid duplicates
      await table.delete(`path LIKE "${pathMapping.from}%"`);
      
      // Create updated records with new paths
      const updatedRecords = records.map(record => {
        // Create new path by replacing the old prefix with the new one
        const newPath = record.path.replace(
          pathMapping.from, 
          pathMapping.to
        );
        
        return { ...record, path: newPath };
      });
      
      // Insert the updated records with new paths
      await table.add(updatedRecords);
      
      return {
        success: true, 
        count: records.length
      };
    }
    
    return { success: true, count: 0 };
  } catch (error) {
    console.error("Failed to update embedding paths:", error);
    return { 
      success: false, 
      error: (error as Error)?.message || "Unknown error updating paths"
    };
  }
};