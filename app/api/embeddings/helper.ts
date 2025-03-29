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
    
    console.log(`Updating embeddings filename from ${oldPath} to ${newPath}`);
    
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
      console.log(`Renaming from "${oldName}" to "${newName}"`);
      
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