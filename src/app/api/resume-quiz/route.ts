import { NextRequest, NextResponse } from 'next/server';
import { resumeQuiz } from '@/lib/actions';

export async function POST(request: NextRequest) {
  const { quizId } = await request.json();
  await resumeQuiz(quizId);
  return NextResponse.json({ success: true });
}