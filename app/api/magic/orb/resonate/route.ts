import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    status: 'resonated',
    pulseId: `pulse_${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
  });
}
