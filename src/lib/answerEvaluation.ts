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
  evaluation: 'correct' | 'incorrect'
) {
  const quiz = await prisma.quiz.findUnique({ 
    where: { id: quizId }, 
    include: { teams: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] } } 
  });
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  
  if (!quiz || !question) return { success: false, error: 'Not found' };
  
  const teamCount = quiz.teams.length;
  const withOptions = question.optionsViewed || question.optionsDefault;
  
  let points = 0;
  if (evaluation === 'correct') {
    points = withOptions ? 5 : 10;
  } else {
    points = withOptions ? -5 : 0;
  }
  
  await prisma.team.update({
    where: { id: teamId },
    data: { score: { increment: points } }
  });
  
  const existingAnswers = (quiz.lastDomainAnswer as any)?.allAnswers || [];
  const teamAnswer = existingAnswers.find((a: any) => a.teamId === teamId) || {};
  
  const updatedAnswer = {
    ...teamAnswer,
    isCorrect: evaluation === 'correct',
    points,
    evaluated: true
  };

  // Check if we should pass to next team (incorrect answer without options)
  const shouldPassToNextTeam = evaluation === 'incorrect' && !question.optionsViewed && !question.optionsDefault;
  
  if (shouldPassToNextTeam) {
    const attemptedTeams = [...new Set([...(question.attemptedBy || []), teamId])];
    let nextAnswerTurnIndex = quiz.answerTurnIndex;
    let nextTeamId = null;
    let foundNextTeam = false;
    
    for (let i = 1; i <= teamCount; i++) {
      const candidateIndex = (quiz.answerTurnIndex + i) % teamCount;
      const candidateTeamId = quiz.teams[candidateIndex]?.id;
      if (candidateTeamId && !attemptedTeams.includes(candidateTeamId)) {
        nextTeamId = candidateTeamId;
        nextAnswerTurnIndex = candidateIndex;
        foundNextTeam = true;
        break;
      }
    }
    
    const answerResult = {
      teamId,
      answer: teamAnswer.answer || '',
      isCorrect: false,
      points: 0,
      withOptions: teamAnswer.withOptions || false,
      wasTabActive: teamAnswer.wasTabActive !== false,
      questionText: question.text,
      correctAnswer: question.answer,
      questionCompleted: !foundNextTeam,
      evaluated: true,
      allAnswers: [...existingAnswers.filter((a: any) => a.teamId !== teamId), updatedAnswer]
    };
    
    if (foundNextTeam && nextTeamId) {
      await prisma.question.update({ 
        where: { id: questionId }, 
        data: { passedFrom: question.passedFrom || teamId, attemptedBy: { push: teamId } } 
      });
      await prisma.quiz.update({ 
        where: { id: quizId }, 
        data: { 
          currentTeamId: nextTeamId, 
          phase: 'answering', 
          timerEndsAt: new Date(Date.now() + 30000), 
          answerTurnIndex: nextAnswerTurnIndex, 
          lastDomainAnswer: answerResult 
        } 
      });
    } else {
      await prisma.question.update({ 
        where: { id: questionId }, 
        data: { isAnswered: true, correctAnswer: question.answer, attemptedBy: { push: teamId } } 
      });
      const newQuestionsInDomain = quiz.questionsInDomain + 1;
      await prisma.quiz.update({
        where: { id: quizId },
        data: { phase: 'showing_result', timerEndsAt: null, questionsInDomain: newQuestionsInDomain, lastDomainAnswer: answerResult }
      });
    }
  } else {
    // Correct or incorrect with options - mark question as answered
    await prisma.question.update({ where: { id: questionId }, data: { isAnswered: true } });
    
    const answerResult = {
      teamId,
      answer: teamAnswer.answer || '',
      isCorrect: evaluation === 'correct',
      points,
      withOptions: teamAnswer.withOptions || false,
      wasTabActive: teamAnswer.wasTabActive !== false,
      questionText: question.text,
      correctAnswer: question.answer,
      questionCompleted: true,
      evaluated: true,
      allAnswers: [...existingAnswers.filter((a: any) => a.teamId !== teamId), updatedAnswer]
    };
    
    const newQuestionsInDomain = quiz.questionsInDomain + 1;
    await prisma.quiz.update({
      where: { id: quizId },
      data: { phase: 'showing_result', timerEndsAt: null, questionsInDomain: newQuestionsInDomain, lastDomainAnswer: answerResult }
    });
  }
  
  revalidateQuizPaths(quizId);
  emitUpdate(quizId);
  return { success: true, points };
}

// Mark a buzzer answer as correct or incorrect (no points yet - just stores evaluation)
export async function evaluateBuzzerAnswer(
  quizId: string,
  teamId: string,
  evaluation: 'correct' | 'incorrect'
) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || !quiz.currentQuestionId) return { success: false, error: 'Not found' };
  
  const pendingAnswers = (quiz.pendingBuzzerAnswers as any) || {};
  const teamAnswer = pendingAnswers[teamId] || { answer: '' };
  
  pendingAnswers[teamId] = {
    ...teamAnswer,
    evaluation,
    needsEvaluation: false,
    evaluated: true
  };
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { pendingBuzzerAnswers: pendingAnswers }
  });
  
  revalidateQuizPaths(quizId);
  emitUpdate(quizId);
  return { success: true };
}

// Process evaluations in buzz order and award points, then move to showing_answer
export async function completeEvaluation(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) return { success: false };
  
  if (quiz.round === 'buzzer') {
    const pendingAnswers = (quiz.pendingBuzzerAnswers as any) || {};
    const results: any = {};
    
    // Walk through buzz sequence in order
    // Penalize wrong answers until we find a correct one, then stop
    for (let i = 0; i < quiz.buzzSequence.length; i++) {
      const teamId = quiz.buzzSequence[i];
      const teamAnswer = pendingAnswers[teamId];
      const isFirstBuzzer = i === 0;
      
      if (!teamAnswer || !teamAnswer.evaluated) {
        const points = isFirstBuzzer ? -10 : -5;
        results[teamId] = { answer: '', isCorrect: false, points, timeout: true };
        await prisma.team.update({ where: { id: teamId }, data: { score: { increment: points } } });
        continue;
      }
      
      if (teamAnswer.evaluation === 'correct') {
        const points = 10;
        results[teamId] = { ...teamAnswer, isCorrect: true, points };
        await prisma.team.update({ where: { id: teamId }, data: { score: { increment: points } } });
        
        // Remaining teams: not reached, no penalty
        for (let j = i + 1; j < quiz.buzzSequence.length; j++) {
          const remainingTeamId = quiz.buzzSequence[j];
          const remainingAnswer = pendingAnswers[remainingTeamId];
          results[remainingTeamId] = { ...(remainingAnswer || { answer: '' }), isCorrect: false, points: 0, notReached: true };
        }
        break;
      } else {
        const points = isFirstBuzzer ? -10 : -5;
        results[teamId] = { ...teamAnswer, isCorrect: false, points };
        await prisma.team.update({ where: { id: teamId }, data: { score: { increment: points } } });
      }
    }
    
    await prisma.buzzerQuestion.update({ where: { id: quiz.currentQuestionId! }, data: { isAnswered: true } });
    
    await prisma.quiz.update({
      where: { id: quizId },
      data: { 
        phase: 'showing_answer',
        timerEndsAt: null,
        lastRoundResults: { _buzzOrder: quiz.buzzSequence, ...results },
        pendingBuzzerAnswers: {},
        buzzTimers: {}
      }
    });
  }
  
  revalidateQuizPaths(quizId);
  emitUpdate(quizId);
  return { success: true };
}
