import { NextRequest, NextResponse } from 'next/server';

function mockLeaderboard(limit: number) {
  const entries = Array.from({ length: 20 }, () => ({
    address:
      '0x' +
      Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(''),
    ritualsConfirmed: Math.floor(Math.random() * 40),
    blessingsSent: Math.floor(Math.random() * 25),
    relicsCreated: Math.floor(Math.random() * 10),
  }));

  return entries
    .map((e) => ({
      ...e,
      totalScore:
        e.ritualsConfirmed * 3 + e.blessingsSent * 2 + e.relicsCreated * 5,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit)
    .map((e, i) => ({ rank: i + 1, ...e }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get('limit'));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, 50)
      : 10;

  try {
    // TODO: Replace mock with real quest log backend
    // const res = await fetch(`${process.env.QUEST_LOG_URL}/leaderboard?limit=${limit}`);
    // if (!res.ok) throw new Error(`Upstream ${res.status}`);
    // const data = await res.json();
    // return NextResponse.json(data);

    const leaderboard = mockLeaderboard(limit);
    return NextResponse.json({
      leaderboard,
      count: leaderboard.length,
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
