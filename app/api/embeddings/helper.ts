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

export interface GraphNode {
  id: string;
  name: string;
  path: string;
  val: number; // Size of node
  color: string; // Color of node
  isFolder?: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number; // Link strength
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

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

// Calculate similarity between two embedding vectors
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Build graph data from embeddings
export const buildGraphData = async (table: any, threshold = 0.7): Promise<GraphData> => {
  // Check if the table has data
  let rowCount = 0;
  try {
    const countQuery = await table.countRows();
    rowCount = countQuery.count;
  } catch (error) {
    console.error("Error counting rows:", error);
  }
  
  // If no embeddings, return empty graph
  if (rowCount === 0) {
    return { nodes: [], links: [] };
  }
  
  // Get all embeddings from the table, limit to first 200 for performance
  // Only select needed fields to reduce memory usage
  const allEmbeddings = await table.query().select(['path', 'name', 'vector'])
    .limit(200) // Limit to prevent browser memory issues
    .toArray();
  
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const folderNodes = new Map<string, GraphNode>();
  const processedPaths = new Set<string>();
  
  // Organize by folders and keep track of folder depths
  const folderDepths = new Map<string, number>();
  const getOrCreateFolderNode = (path: string, depth: number): GraphNode => {
    if (folderNodes.has(path)) {
      return folderNodes.get(path)!;
    }
    
    const pathParts = path.split('/');
    const folderName = pathParts[pathParts.length - 1] || 'root';
    
    const folderNode: GraphNode = {
      id: path,
      name: folderName,
      path: path,
      val: 1 + (0.1 * depth), // Slightly larger nodes for higher level folders
      color: 'neutral',
      isFolder: true
    };
    
    folderNodes.set(path, folderNode);
    folderDepths.set(path, depth);
    nodes.push(folderNode);
    
    return folderNode;
  };
  
  // First pass: create nodes for documents and folders (with optimized folder structure)
  allEmbeddings.forEach((embedding: any, index: number) => {
    if (processedPaths.has(embedding.path)) return; // Skip duplicates
    processedPaths.add(embedding.path);
    
    const pathParts = embedding.path.split('/');
    const fileName = pathParts.pop() || '';
    
    // Generate folder path hierarchy and create intermediate folders
    let currentPath = '';
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const prevPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      // Create folder node if it doesn't exist
      if (!processedPaths.has(currentPath)) {
        processedPaths.add(currentPath);
        const folderNode = getOrCreateFolderNode(currentPath, i);
        
        // Connect to parent folder
        if (prevPath) {
          links.push({
            source: prevPath,
            target: currentPath,
            value: 0.3 // Weaker connections for folder structure
          });
        }
      }
    }
    
    // Generate a color based on the file extension for more meaningful grouping
    const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];   
    
    // Add document node with a more consistent size
    nodes.push({
      id: embedding.path,
      name: embedding.name || fileName,
      path: embedding.path,
      val: 0.8, // Smaller consistent size
      color: 'primary'
    });
    
    // Connect documents to their direct parent folder only
    const folderPath = pathParts.join('/');
    if (folderPath) {
      links.push({
        source: folderPath,
        target: embedding.path,
        value: 0.5
      });
    }
  });
  
  // Calculate similarity links, but limit the total number of links for performance
  const maxSimilarityLinks = 100; // Limit total similarity links
  let similarityLinkCount = 0;
  
  // Second pass: calculate similarities more efficiently
  outerLoop: for (let i = 0; i < allEmbeddings.length && similarityLinkCount < maxSimilarityLinks; i++) {
    const embA = allEmbeddings[i];
    const vectorA = embA.vector.toArray();
    
    for (let j = i + 1; j < allEmbeddings.length; j++) {
      // Exit early if we hit our link limit
      if (similarityLinkCount >= maxSimilarityLinks) break outerLoop;
      
      const embB = allEmbeddings[j];
      const vectorB = embB.vector.toArray();
      
      // Optimize similarity calculation by early exit if paths are very different
      // This reduces unnecessary calculations
      const pathSimilarity = embA.path.startsWith(embB.path) || embB.path.startsWith(embA.path);
      if (!pathSimilarity) {
        // Quick check to see if it's worth calculating full similarity
        // Sample just a few dimensions for a rough estimate
        let quickSimilarity = 0;
        const sampleSize = Math.min(10, vectorA.length);
        for (let k = 0; k < sampleSize; k++) {
          quickSimilarity += vectorA[k] * vectorB[k];
        }
        if (quickSimilarity < threshold * 0.8) continue; // Skip if rough estimate is below threshold
      }
      
      // Calculate full similarity for promising pairs
      const similarity = cosineSimilarity(vectorA, vectorB);
      
      if (similarity > threshold) {
        links.push({
          source: embA.path,
          target: embB.path,
          value: similarity * 0.8 // Scale down for better visualization
        });
        similarityLinkCount++;
      }
    }
  }
  
  return { nodes, links };
};