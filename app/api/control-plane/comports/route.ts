import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.meechain.live';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.meechain.live';

interface PortDefinition {
  id: string;
  name: string;
  port: string;
  deviceType: string;
  baudRate: number | null;
  probeUrl: string | null;
  probeMethod: 'GET' | 'RPC' | null;
}

const PORT_DEFINITIONS: PortDefinition[] = [
  {
    id: 'cp_api',
    name: 'API Gateway',
    port: 'api.meechain.live',
    deviceType: 'REST API Gateway',
    baudRate: null,
    probeUrl: `${API_URL}/health`,
    probeMethod: 'GET',
  },
  {
    id: 'cp_rpc',
    name: 'RPC Node',
    port: 'rpc.meechain.live',
    deviceType: 'JSON-RPC Endpoint',
    baudRate: null,
    probeUrl: RPC_URL,
    probeMethod: 'RPC',
  },
  {
    id: 'cp_hsm',
    name: 'ComPort Gamma',
    port: '/dev/ttyUSB0',
    deviceType: 'Hardware Oracle Relay',
    baudRate: 57600,
    probeUrl: null,
    probeMethod: null,
  },
  {
    id: 'cp_sig',
    name: 'ComPort Delta',
    port: '/dev/ttyUSB1',
    deviceType: 'Signature Verifier',
    baudRate: 38400,
    probeUrl: null,
    probeMethod: null,
  },
];

type ProbeResult = {
  status: 'connected' | 'offline' | 'unknown';
  latencyMs: number | null;
  source: 'live-probe' | 'identity-only';
};

async function probePort(def: PortDefinition): Promise<ProbeResult> {
  if (!def.probeUrl) {
    return { status: 'unknown', latencyMs: null, source: 'identity-only' };
  }

  const start = Date.now();
  try {
    if (def.probeMethod === 'RPC') {
      const res = await fetch(def.probeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      const json = (await res.json()) as { result?: string };
      return {
        status: res.ok && json?.result ? 'connected' : 'offline',
        latencyMs: Date.now() - start,
        source: 'live-probe',
      };
    }
    const res = await fetch(def.probeUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    return {
      status: res.ok ? 'connected' : 'offline',
      latencyMs: Date.now() - start,
      source: 'live-probe',
    };
  } catch {
    return { status: 'offline', latencyMs: null, source: 'live-probe' };
  }
}

export async function GET() {
  const ports = await Promise.all(
    PORT_DEFINITIONS.map(async (def) => {
      const probe = await probePort(def);
      return {
        id: def.id,
        name: def.name,
        port: def.port,
        deviceType: def.deviceType,
        baudRate: def.baudRate,
        ...probe,
        identity: 'configured' as const,
      };
    })
  );

  return NextResponse.json({ ports, updatedAt: new Date().toISOString() });
}
