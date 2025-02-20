import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = process.env.NEXT_PUBLIC_DATA_PATH || 'data';
const MODEL_PATH = process.env.NEXT_PUBLIC_MODEL_PATH || 'models';
const BASE_PATH = `/${DATA_PATH}/${MODEL_PATH}/`.replace('//', '');

export async function GET(
  req: Request,
  { params }: { params: Promise<{ model: string[] }> }
) {
  const { model } = await params;
  const modelPath = path.join(BASE_PATH, ...model);

  if (fs.existsSync(modelPath)) {
    const modelFile = fs.readFileSync(modelPath);
    const stats = fs.statSync(modelPath);

    return new NextResponse(modelFile, {
      status: 200,
      headers: {
        'Content-Length': stats.size.toString(),
        'Content-Type': 'application/octet-stream',
      },
    });
  } else {
    return new NextResponse('Model not found', { status: 404 });
  }
}
