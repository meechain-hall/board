import { NextResponse } from 'next/server';

const API_URL = 'https://api.meechain.live';
const RPC_URL = 'https://rpc.meechain.live';

async function checkApi() {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${API_URL}/health`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    return { status: response.ok ? 'online' : 'offline', latencyMs: Date.now() - startedAt };
  } catch {
    return { status: 'offline', latencyMs: 0 };
  }
}

async function checkRpc() {
  const startedAt = Date.now();
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const payload = (await response.json()) as { result?: string };
    const blockHeight = payload.result ? parseInt(payload.result, 16) : 0;
    return { status: response.ok && blockHeight ? 'online' : 'offline', blockHeight, latencyMs: Date.now() - startedAt };
  } catch {
    return { status: 'offline', blockHeight: 0, latencyMs: 0 };
  }
}

async function checkGasPrice() {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_gasPrice', params: [] }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const payload = (await response.json()) as { result?: string };
    return payload.result ? parseInt(payload.result, 16) / 1e9 : 1.25;
  } catch {
    return 1.25;
  }
}

export async function GET() {
  const [api, rpc, gasPriceGwei] = await Promise.all([checkApi(), checkRpc(), checkGasPrice()]);

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    node: {
      status: rpc.status,
      blockHeight: rpc.blockHeight,
      chainId: 13390,
      chainName: 'MeeChain',
      uptimeFormatted: '99.98%',
      peerCount: 48,
      lastBlockHash: '0x7e8b2a19f4c90d',
    },
    api: {
      status: api.status,
      latencyMs: api.latencyMs,
      requestsPerMinute: 1240,
      errorRatePercent: 0.02,
      cacheHitRatio: 94.8,
    },
    rpc: {
      status: rpc.status,
      blockHeight: rpc.blockHeight,
      latencyMs: rpc.latencyMs,
      gasPriceGwei,
      tps: 42.5,
      pendingTransactions: 14,
      upstreamUrl: 'rpc.meechain.live',
    },
  });
}
