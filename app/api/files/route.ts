import { createFile, fetchFiles } from './helper';

import { NextResponse } from 'next/server';

const DATA_PATH = process.env.NEXT_PUBLIC_DATA_PATH || 'data';
const VAULT_PATH = process.env.NEXT_PUBLIC_VAULT_PATH || 'vault';
const BASE_PATH = `/${DATA_PATH}/${VAULT_PATH}/`.replace('//', '');

export async function GET() {
  try {
    const fileTree = fetchFiles(BASE_PATH);
    return NextResponse.json(fileTree);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Failed to read directory' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const createdItem = createFile(DATA_PATH, body);
    return NextResponse.json(createdItem, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create file/folder' },
      { status: 500 }
    );
  }
}

