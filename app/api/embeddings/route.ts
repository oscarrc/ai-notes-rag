import { connectDB, getTable } from './helper';

import { NextResponse } from 'next/server';

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

export async function POST(req: Request) {
  const data = await req.json();

  try {
    const db = await connectDB();
    const table = await getTable(db, 'embeddings');
    const embeddings = Array.isArray(data) ? data : [data];

    await table
      .mergeInsert("path")
      .whenMatchedUpdateAll()
      .whenNotMatchedInsertAll()
      .execute(embeddings);

    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Failed to connectDB' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const data = await req.json();

  try {
    const db = await connectDB();
    const table = await getTable(db, 'embeddings');
    
    const results = await table
      .search(data)
      .distanceType("cosine")
      .distanceRange(0, 0.6)
      .limit(5)
      .toArray();

    return NextResponse.json(results);
  } catch (error) {
    console.log("Error in vector search:", error);
    return NextResponse.json({ error: 'Failed to perform vector search' }, { status: 500 });
  }
}