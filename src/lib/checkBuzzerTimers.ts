'use server';

import { prisma } from './db';
import { processBuzzerAnswers, handleBuzzTimerExpiry } from './actions';

export async function checkBuzzerTimers(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.round !== 'buzzer') return { success: false };
  if (quiz.phase !== 'answering' && quiz.phase !== 'processing_answers' && quiz.phase !== 'buzzing') return { success: false };
  
  // If already in processing_answers phase, process immediately
  if (quiz.phase === 'processing_answers') {
    return processBuzzerAnswers(quizId);
  }
  
  const buzzTimers = (quiz.buzzTimers as any) || {};
  const pendingAnswers = (quiz.pendingBuzzerAnswers as any) || {};
  const now = Date.now();
  
  // Check if 10-second buzz window has expired
  const buzzWindowExpired = quiz.timerEndsAt && new Date(quiz.timerEndsAt).getTime() <= now;
  
  // If in buzzing phase and buzz window expired with no buzzes, handle expiry
  if (quiz.phase === 'buzzing' && buzzWindowExpired && quiz.buzzSequence.length === 0) {
    return handleBuzzTimerExpiry(quizId);
  }
  
  // If teams have buzzed, check if all have answered or timed out
  if (quiz.buzzSequence.length > 0 && (quiz.phase === 'answering' || (quiz.phase === 'buzzing' && buzzWindowExpired))) {
    const allDone = quiz.buzzSequence.every((teamId: string) => {
      return pendingAnswers[teamId] || (buzzTimers[teamId] && buzzTimers[teamId] <= now);
    });
    
    if (allDone) {
      return processBuzzerAnswers(quizId);
    }
  }
  
  return { success: false };
}
