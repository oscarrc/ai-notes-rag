import { NextResponse } from 'next/server';
import { connectDB, getTable } from './helper';

export async function GET() {
  try {
    const db = await connectDB();
    const table = await getTable(db, 'embeddings');
    return NextResponse.json({});
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Failed to connectDB' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const db = await connectDB();
    const table = await getTable(db, 'embeddings');
    return NextResponse.json({});
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Failed to connectDB' }, { status: 500 });
  }
}
