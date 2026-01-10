import { NextRequest, NextResponse } from 'next/server';
import { pauseQuiz } from '@/lib/actions';

export async function POST(request: NextRequest) {
  const { quizId } = await request.json();
  await pauseQuiz(quizId);
  return NextResponse.json({ success: true });
}