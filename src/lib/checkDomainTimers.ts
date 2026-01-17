'use server';

import { prisma } from './db';
import { handleTimerExpiry } from './actions';

export async function checkDomainTimers(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  
  // Only check during answering phases in domain round
  if (!quiz || quiz.round !== 'domain' || (quiz.phase !== 'answering' && quiz.phase !== 'answering_with_options')) {
    return { success: false };
  }
  
  // Check if timer has expired
  if (!quiz.timerEndsAt) {
    return { success: false };
  }
  
  const now = Date.now();
  const timerExpired = new Date(quiz.timerEndsAt).getTime() <= now;
  
  if (timerExpired) {
    // Timer expired - handle timeout (pass question)
    return handleTimerExpiry(quizId);
  }
  
  return { success: false };
}
