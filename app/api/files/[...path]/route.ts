import { updateEmbeddingPaths } from '../../embeddings/helper';
import { deleteFile, getFile, moveFile, updateFile } from '../helper';

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
    
    if ((movedFile.extension === '.md' || !movedFile.extension) && movedFile._pathMapping) {
      try {
        const result = await updateEmbeddingPaths(movedFile._pathMapping);
        if (!result.success) {
          console.error("Failed to update vector database paths:", result.error);
        } else if (result.count > 0) {
          console.log(`Updated ${result.count} embedding records`);
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

  const fileNode: FileNode = await req.json();

  if (!fileNode)
    return NextResponse.json({ error: 'File is required' }, { status: 400 });

  try {
    const updatedFile = updateFile(filePath, fileNode);
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
