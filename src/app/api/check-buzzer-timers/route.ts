import { NextRequest, NextResponse } from 'next/server';
import { checkBuzzerTimers } from '@/lib/checkBuzzerTimers';

export async function POST(request: NextRequest) {
  const { quizId } = await request.json();
  await checkBuzzerTimers(quizId);
  return NextResponse.json({ success: true });
}