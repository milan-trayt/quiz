import { NextRequest, NextResponse } from 'next/server';
import { handleBuzzerTimerExpiry } from '@/lib/buzzerTimer';

export async function POST(request: NextRequest) {
  const { quizId } = await request.json();
  await handleBuzzerTimerExpiry(quizId);
  return NextResponse.json({ success: true });
}