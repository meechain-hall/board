import { NextRequest, NextResponse } from 'next/server';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.meechain.live';

function mockTransactions(limit: number) {
  return Array.from({ length: limit }, (_, i) => {
    const blockNumber = 23 - i;
    return {
      hash:
        '0x' +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
      from: '0x' + Math.random().toString(16).slice(2, 10).padEnd(40, '0'),
      to: '0x' + Math.random().toString(16).slice(2, 10).padEnd(40, '0'),
      value: (Math.random() * 500).toFixed(4),
      blockNumber,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      status: 'confirmed' as const,
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get('limit'));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, 50)
      : 5;

  try {
    // TODO: Replace mock with real data source (indexer/DB/RPC)
    // const res = await fetch(`${process.env.INDEXER_URL}/transactions?limit=${limit}`);
    // if (!res.ok) throw new Error(`Upstream ${res.status}`);
    // const data = await res.json();
    // return NextResponse.json(data);

    void RPC_URL; // reserved for future real fetch
    const transactions = mockTransactions(limit);
    return NextResponse.json({
      transactions,
      count: transactions.length,
      mock: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
