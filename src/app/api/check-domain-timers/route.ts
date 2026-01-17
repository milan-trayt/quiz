import { NextRequest, NextResponse } from 'next/server';
import { checkDomainTimers } from '@/lib/checkDomainTimers';

export async function POST(request: NextRequest) {
  const { quizId } = await request.json();
  await checkDomainTimers(quizId);
  return NextResponse.json({ success: true });
}
