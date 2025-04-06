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

export const createIndex = async (table: lancedb.Table, fieldName: string, config: any) => {
  const POLL_INTERVAL = 10000;
  const indexes = await table.listIndices();
  const indexName = `${fieldName}_idx`;
  const indexExists = indexes.some((index) => index.name === indexName);

  if(indexExists) return;

  await table.createIndex(fieldName, {
    config,
  });

  while (true) {
    const indices = await table.listIndices();
    if (indices.some((index) => index.name === indexName)) break;
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
}

export const hasTextIndex = async (table: any) => {
  const indexes = await table.listIndices();
  return indexes.some((index: any) => ['content_idx', 'name_idx'].includes(index.name));
}

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

    const table = await db.createEmptyTable(tableName, embeddingsSchema, {
      existOk: true,
    });

    await createIndex(
      table,
      'vector',
      lancedb.Index.hnswSq({
        numPartitions: 1,
        distanceType: 'cosine',
      })
    );

    await createIndex(table, 'content', lancedb.Index.fts());
    await createIndex(table, 'name', lancedb.Index.fts());

    return table;
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
};

export const updateEmbeddingPaths = async (pathMapping: { from: string; to: string }) => {
  try {
    const db = await connectDB();
    const table = await getTable(db, 'embeddings');
    
    const records = await table.query(
      `path LIKE "%${pathMapping.from}%"`
    ).toArray();
    
    if (records && records.length > 0) {
      await table.delete(`path LIKE "%${pathMapping.from}%"`);
      
      const updatedRecords = records.map((record: FileNode) => {
        const newPath = record.path.replace(
          pathMapping.from, 
          pathMapping.to
        );
        
        return { ...record, path: newPath };
      });
      
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

export const updateEmbeddingsFilename = async (oldPath: string, newPath: string) => {
  try {
    const db = await connectDB();
    const table = await getTable(db, 'embeddings');
        
    const exactRecords = await table.query(`path = "${oldPath}"`).toArray();  
    const childRecords = await table.query(`path LIKE "%${oldPath}/%"`).toArray();
    
    const records = [...exactRecords, ...childRecords];
    
    if (records && records.length > 0) {
      if (exactRecords.length > 0) {
        await table.delete(`path = "${oldPath}"`);
      }
      
      if (childRecords.length > 0) {
        await table.delete(`path LIKE "%${oldPath}/%"`);
      }
      
      const oldName = path.basename(oldPath, path.extname(oldPath));
      const newName = path.basename(newPath, path.extname(newPath));
      
      const updatedRecords = records.map((record: any) => {
        let updatedPath = record.path;
        
        if (record.path === oldPath) {
          updatedPath = newPath;
        } else if (record.path.startsWith(`${oldPath}/`)) {
          updatedPath = record.path.replace(`${oldPath}/`, `${newPath}/`);
        }
        
        const updatedName = record.name === oldName ? newName : record.name;
        
        return { 
          ...record, 
          path: updatedPath,
          name: updatedName
        };
      });
      
      await table.add(updatedRecords);
      
      return {
        success: true, 
        count: records.length
      };
    }
    
    return { success: true, count: 0 };
  } catch (error) {
    console.error("Error updating embeddings filename:", error);
    return { 
      success: false, 
      error: (error as Error)?.message || "Unknown error updating embeddings filename"
    };
  }
};

export const deleteEmbeddings = async (path: string) => {
  try {
    const db = await connectDB();
    const table = await getTable(db, 'embeddings');
    
    const records = await table.query(`path LIKE "%${path}%"`).toArray();
    
    if (records && records.length > 0) {
      await table.delete(`path LIKE "${path}"`);
      
      return {
        success: true, 
        count: records.length
      };
    }
    
    return { success: true, count: 0 };
  } catch (error) {
    console.error("Failed to delete embeddings:", error);
    return { 
      success: false, 
      error: (error as Error)?.message || "Unknown error deleting embeddings"
    };
  }
}

export const getReranker = async () => await lancedb.rerankers.RRFReranker.create();