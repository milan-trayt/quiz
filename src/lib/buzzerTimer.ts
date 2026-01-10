'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';

async function emitUpdate(quizId: string) {
  try {
    await fetch('http://localhost:4000/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, event: 'quiz-update', data: {} })
    });
  } catch (error) {
    console.error('Failed to emit update:', error);
  }
}

export async function handleBuzzerTimerExpiry(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.phase !== 'showing_answer') return { success: false };
  
  const nextQuestion = await prisma.buzzerQuestion.findFirst({
    where: { quizId, isAnswered: false },
    orderBy: { number: 'asc' },
  });
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { 
      phase: nextQuestion ? 'buzzing' : 'completed',
      currentQuestionId: nextQuestion?.id || null,
      buzzSequence: [],
      currentTeamId: null,
      timerEndsAt: nextQuestion ? new Date(Date.now() + 10000) : null,
      pendingBuzzerAnswers: {},
      buzzTimers: {},
      lastRoundResults: {}
    },
  });
  
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}
