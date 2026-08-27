import { NextResponse } from 'next/server';

const API_URL = 'https://api.meechain.live';

export async function GET() {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${API_URL}/health`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    return NextResponse.json({
      status: response.ok ? 'healthy' : 'degraded',
      latency: Date.now() - startedAt,
      services: { nginx: true, apiGateway: response.ok, anvilNode: true, rpcProxy: true },
    });
  } catch {
    return NextResponse.json({
      status: 'offline',
      latency: null,
      services: { nginx: false, apiGateway: false, anvilNode: false, rpcProxy: false },
    });
  }
}
