import { NextResponse } from 'next/server';
import { getFile, updateFile, deleteFile } from '../helper';
import path from 'path';

const DATA_PATH = process.env.NEXT_PUBLIC_DATA_PATH || 'data';

export async function GET(
  req: Request,
  { params }: { params: { path?: string[] } }
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

export async function PUT(
  req: Request,
  { params }: { params: { path?: string[] } }
) {
  const { path: filePath } = await params;

  if (!filePath)    
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });

  const fileNode: FileNode = await req.json();

  if(!fileNode)    
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
  { params }: { params: { path?: string[] } }
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
