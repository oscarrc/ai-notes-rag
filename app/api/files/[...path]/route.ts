import { deleteFile, getFile, moveFile, renameFile, updateFile } from '../helper';
import { updateEmbeddingPaths, updateEmbeddingsFilename } from '../../embeddings/helper';

import { NextResponse } from 'next/server';
import path from 'path';

const DATA_PATH = process.env.NEXT_PUBLIC_DATA_PATH || 'data';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path: filePath } = await params;

  if (!filePath)
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });

  try {
    const fileNode = getFile(filePath);
    if (!fileNode)
      return NextResponse.json({ error: 'File not found' }, { status: 404 });

    return NextResponse.json(fileNode);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: sourcePath } = await params;
    const { targetPath } = await req.json();

    if(!sourcePath || !targetPath)
      return NextResponse.json({ error: 'Source and target paths are required' }, { status: 400 });
    
    const movedFile = await moveFile(sourcePath, targetPath);
    
    if (movedFile._pathMapping) {
      try {
        const oldPath = movedFile._pathMapping.from;
        const newPath = movedFile._pathMapping.to;
        
        const result = await updateEmbeddingPaths({
          from: oldPath,
          to: newPath
        });
        
        if (!result.success) {
          console.error("Failed to update vector database paths after move:", result.error);
        } else if (result.count > 0) {
          console.log(`Updated ${result.count} embedding records after move`);
        }
      } catch (dbError) {
        console.error("Failed to update vector database paths:", dbError);
      }
    }

    return NextResponse.json(movedFile);
  } catch (error) {
    return NextResponse.json({ error: (error as Error)?.message ?? 'Failed to move file' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path: filePath } = await params;

  if (!filePath)
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });

  const data = await req.json();

  try {
    if (data.name) {
      const originalName = filePath[filePath.length - 1];
      const originalNameWithoutExt = originalName.includes('.') ? 
        originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
      
      if (data.name !== originalNameWithoutExt) {
        
        const renamedFile = renameFile(filePath, data.name);
        
        if (renamedFile._pathMapping) {
          try {
            const oldPath = renamedFile._pathMapping.from;
            const newPath = renamedFile._pathMapping.to;
            
            await updateEmbeddingsFilename(oldPath, newPath);            
          } catch (error) {
            console.error("Failed to update vector database:", error);
          }
        }
        
        return NextResponse.json(renamedFile);
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to rename file' },
      { status: 500 }
    );
  }
  
  if (!data)
    return NextResponse.json({ error: 'File data is required' }, { status: 400 });

  try {
    const updatedFile = updateFile(filePath, data);
    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path: filePath } = await params;

  if (!filePath)
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });

  const fullPath = path.join(DATA_PATH, ...filePath);

  try {
    deleteFile(fullPath);
    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
