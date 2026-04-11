import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    commit: process.env.RAILWAY_GIT_COMMIT_SHA ?? 'unknown',
  }, { status: 200 });
}
