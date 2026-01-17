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

// Evaluate domain answer manually
export async function evaluateDomainAnswer(
  quizId: string,
  teamId: string,
  questionId: string,
  evaluation: 'correct' | 'partial' | 'incorrect'
) {
  const quiz = await prisma.quiz.findUnique({ 
    where: { id: quizId }, 
    include: { teams: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] } } 
  });
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  
  if (!quiz || !question) return { success: false, error: 'Not found' };
  
  const teamCount = quiz.teams.length;
  let points = 0;
  
  // Calculate points based on evaluation
  if (evaluation === 'correct') {
    points = 10; // Full points for correct
  } else if (evaluation === 'partial') {
    points = 5; // Half points for partially correct
  } else {
    points = 0; // No points for incorrect
  }
  
  // Award points
  await prisma.team.update({
    where: { id: teamId },
    data: { score: { increment: points } }
  });
  
  // Mark question as answered
  await prisma.question.update({
    where: { id: questionId },
    data: { isAnswered: true }
  });
  
  // Update quiz state with evaluation result
  const existingAnswers = (quiz.lastDomainAnswer as any)?.allAnswers || [];
  const teamAnswer = existingAnswers.find((a: any) => a.teamId === teamId) || {};
  
  const updatedAnswer = {
    ...teamAnswer,
    isCorrect: evaluation === 'correct',
    isPartial: evaluation === 'partial',
    points,
    evaluated: true
  };
  
  const answerResult = {
    teamId,
    answer: teamAnswer.answer || '',
    isCorrect: evaluation === 'correct',
    isPartial: evaluation === 'partial',
    points,
    withOptions: false,
    wasTabActive: true,
    questionText: question.text,
    correctAnswer: question.answer,
    questionCompleted: true,
    evaluated: true,
    allAnswers: [...existingAnswers.filter((a: any) => a.teamId !== teamId), updatedAnswer]
  };
  
  // Check if domain is complete
  const newQuestionsInDomain = quiz.questionsInDomain + 1;
  const domain = await prisma.domain.findUnique({ 
    where: { id: quiz.selectedDomainId! }, 
    include: { questions: true } 
  });
  const totalQuestionsForDomain = Math.floor((domain?.questions.length || 0) / teamCount) * teamCount;
  
  // Always go to showing_result phase after evaluation
  await prisma.quiz.update({
    where: { id: quizId },
    data: { 
      phase: 'showing_result', 
      timerEndsAt: null, 
      questionsInDomain: newQuestionsInDomain,
      lastDomainAnswer: answerResult 
    }
  });
  
  revalidateQuizPaths(quizId);
  emitUpdate(quizId);
  return { success: true, points };
}

// Evaluate buzzer answer manually
export async function evaluateBuzzerAnswer(
  quizId: string,
  teamId: string,
  evaluation: 'correct' | 'partial' | 'incorrect'
) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || !quiz.currentQuestionId) return { success: false, error: 'Not found' };
  
  const buzzIndex = quiz.buzzSequence.indexOf(teamId);
  const isFirstBuzzer = buzzIndex === 0;
  
  let points = 0;
  
  // Calculate points based on evaluation and buzz position
  if (evaluation === 'correct') {
    points = isFirstBuzzer ? 10 : 5;
  } else if (evaluation === 'partial') {
    points = isFirstBuzzer ? 5 : 2; // Half points
  } else {
    points = isFirstBuzzer ? -10 : -5;
  }
  
  // Award points
  await prisma.team.update({
    where: { id: teamId },
    data: { score: { increment: points } }
  });
  
  // Update last round results
  const lastResults = (quiz.lastRoundResults as any) || {};
  const pendingAnswers = (quiz.pendingBuzzerAnswers as any) || {};
  const teamAnswer = pendingAnswers[teamId] || { answer: '' };
  
  lastResults[teamId] = {
    ...teamAnswer,
    isCorrect: evaluation === 'correct',
    isPartial: evaluation === 'partial',
    points,
    evaluated: true
  };
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { lastRoundResults: lastResults }
  });
  
  revalidateQuizPaths(quizId);
  emitUpdate(quizId);
  return { success: true, points };
}

// Mark question as evaluated and move to showing_answer
export async function completeEvaluation(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) return { success: false };
  
  if (quiz.round === 'buzzer') {
    // Mark question as answered
    await prisma.buzzerQuestion.update({
      where: { id: quiz.currentQuestionId! },
      data: { isAnswered: true }
    });
    
    await prisma.quiz.update({
      where: { id: quizId },
      data: { 
        phase: 'showing_answer',
        timerEndsAt: null
      }
    });
  }
  
  revalidateQuizPaths(quizId);
  emitUpdate(quizId);
  return { success: true };
}
