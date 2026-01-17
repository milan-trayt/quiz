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

async function revalidateQuizPaths(quizId: string) {
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/host/setup`);
  revalidatePath(`/quiz/${quizId}/host/control`);
  revalidatePath(`/quiz/${quizId}/team`);
}

// Move to next question in buzzer round
export async function nextBuzzerQuestion(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.round !== 'buzzer' || quiz.phase !== 'showing_answer') {
    return { success: false, error: 'Not in showing_answer phase' };
  }
  
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
  
  revalidateQuizPaths(quizId);
  emitUpdate(quizId);
  return { success: true };
}

// Move to next question/selector in domain round
export async function nextDomainQuestion(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ 
    where: { id: quizId }, 
    include: { teams: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] }, domains: { include: { questions: true } } } 
  });
  
  if (!quiz || quiz.round !== 'domain' || quiz.phase !== 'showing_result') {
    return { success: false, error: 'Not in showing_result phase' };
  }
  
  const teamCount = quiz.teams.length;
  const domain = await prisma.domain.findUnique({ 
    where: { id: quiz.selectedDomainId! }, 
    include: { questions: true } 
  });
  const totalQuestionsForDomain = Math.floor((domain?.questions.length || 0) / teamCount) * teamCount;
  
  // Check if domain is complete
  if (quiz.questionsInDomain >= totalQuestionsForDomain) {
    const completedSelections = (quiz.completedDomainRounds || 0) + 1;
    
    if (completedSelections >= (quiz.totalDomainRounds || 0)) {
      // All domains complete
      await prisma.quiz.update({
        where: { id: quizId },
        data: { 
          phase: 'domain_round_ended', 
          currentTeamId: null, 
          currentQuestionId: null, 
          selectedDomainId: null, 
          timerEndsAt: null, 
          completedDomainRounds: completedSelections 
        },
      });
    } else {
      // Move to next domain selector
      const nextDomainIndex = (quiz.domainIndex + 1) % teamCount;
      await prisma.quiz.update({
        where: { id: quizId },
        data: { 
          currentTeamId: quiz.teams[nextDomainIndex]?.id,
          phase: 'selecting_domain',
          currentQuestionId: null,
          selectedDomainId: null,
          timerEndsAt: null,
          questionsInDomain: 0,
          domainSelectingTeam: nextDomainIndex,
          completedDomainRounds: completedSelections,
          domainIndex: nextDomainIndex,
          questionSelectorIndex: nextDomainIndex,
          answerTurnIndex: nextDomainIndex
        },
      });
    }
  } else {
    // Continue in same domain - move to next question selector
    const nextSelectorIndex = (quiz.questionSelectorIndex + 1) % teamCount;
    await prisma.quiz.update({
      where: { id: quizId },
      data: { 
        currentTeamId: quiz.teams[nextSelectorIndex]?.id,
        phase: 'selecting_question',
        currentQuestionId: null,
        timerEndsAt: null,
        questionSelectorIndex: nextSelectorIndex,
        answerTurnIndex: nextSelectorIndex
      },
    });
  }
  
  revalidateQuizPaths(quizId);
  emitUpdate(quizId);
  return { success: true };
}
