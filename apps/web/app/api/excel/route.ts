import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Coming in Phase 2' },
    { status: 501 },
  );
}
