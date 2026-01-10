'use server';

import { prisma } from './db';
import { processBuzzerAnswers, handleBuzzTimerExpiry } from './actions';

export async function checkBuzzerTimers(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || (quiz.phase !== 'answering' && quiz.phase !== 'processing_answers' && quiz.phase !== 'buzzing') || quiz.round !== 'buzzer') return { success: false };
  
  // If already in processing_answers phase, process immediately
  if (quiz.phase === 'processing_answers') {
    return processBuzzerAnswers(quizId);
  }
  
  const buzzTimers = (quiz.buzzTimers as any) || {};
  const now = Date.now();
  
  // Check if 10-second buzz timer has expired (timerEndsAt from startBuzzerRound)
  const buzzWindowExpired = quiz.timerEndsAt && new Date(quiz.timerEndsAt).getTime() <= now;
  
  if (!buzzWindowExpired) {
    // Still within 10-second buzz window - don't process yet
    return { success: false };
  }
  
  // Buzz window expired
  if (quiz.phase === 'buzzing') {
    // If nobody buzzed, handle the expiry
    if (quiz.buzzSequence.length === 0) {
      return handleBuzzTimerExpiry(quizId);
    }
    // If someone buzzed, we should be in answering phase, not buzzing
    return { success: false };
  }
  
  // In answering phase - check if all buzzed teams' timers have expired or they've answered
  const pendingAnswers = (quiz.pendingBuzzerAnswers as any) || {};
  const allDone = quiz.buzzSequence.every(teamId => {
    return pendingAnswers[teamId] || (buzzTimers[teamId] && buzzTimers[teamId] <= now);
  });
  
  if (allDone) {
    return processBuzzerAnswers(quizId);
  }
  
  return { success: false };
}
