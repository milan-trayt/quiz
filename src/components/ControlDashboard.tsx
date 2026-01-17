'use client';

import { Play, Pause, RotateCcw, Eye, Users, ArrowRight, Check, X, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { startDomainRound, startBuzzerRound, resetQuiz, disconnectTeamCaptain } from '@/lib/actions';
import { nextBuzzerQuestion, nextDomainQuestion } from '@/lib/manualProgression';
import { evaluateDomainAnswer, evaluateBuzzerAnswer, completeEvaluation } from '@/lib/answerEvaluation';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

export default function ControlDashboard({ quiz }: { quiz: any }) {
  const { socket, isConnected, hasReconnected } = useSocket(quiz.id);
  const router = useRouter();

  // Periodic check for domain round timer expiry (server-side)
  useEffect(() => {
    if (quiz.round === 'domain' && (quiz.phase === 'answering' || quiz.phase === 'answering_with_options')) {
      const interval = setInterval(() => {
        fetch('/api/check-domain-timers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: quiz.id })
        });
      }, 1000); // Check every second
      return () => clearInterval(interval);
    }
  }, [quiz.round, quiz.phase, quiz.id]);

  // Note: Timer handling removed - showing_result and showing_answer phases 
  // are now controlled manually via "Next Question" button

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">🎮 Control Dashboard</h1>
            <a 
              href={`/quiz/${quiz.id}/host/setup`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
            >
              ← Back to Setup
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-sm font-medium">Quiz ID:</p>
              <p className="text-xl font-mono mt-2 break-all">{quiz.id}</p>
            </div>
            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4">
              <p className="text-sm font-medium">Spectator View:</p>
              <a 
                href={`/quiz/${quiz.id}/spectator`} 
                target="_blank" 
                className="text-lg font-semibold text-orange-300 hover:text-orange-200 underline mt-2 flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Open Spectator Mode
              </a>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Game Status</p>
              <div className="space-y-1 text-sm">
                <div>Status: <span className="font-semibold capitalize">{quiz.status}</span></div>
                <div>Round: <span className="font-semibold capitalize">{quiz.round.replace('_', ' ')}</span></div>
                {quiz.currentTeamId && (
                  <div className="mt-2 p-2 bg-green-500/20 border border-green-500 rounded">
                    <span className="font-semibold">Turn: </span>
                    {quiz.teams.find((t: any) => t.id === quiz.currentTeamId)?.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Answer Evaluation & Progression Panel - Always visible */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur border-2 border-purple-500 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">⚖️ Evaluation & Progression</h2>
          
          {/* Domain Round - Awaiting Evaluation */}
          {quiz.phase === 'awaiting_evaluation' && quiz.round === 'domain' && quiz.lastDomainAnswer && (
            <div className="space-y-4">
              <div className="bg-slate-800/70 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Question:</p>
                <p className="text-lg font-semibold">{quiz.lastDomainAnswer.questionText}</p>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Correct Answer:</p>
                <p className="text-lg font-semibold text-green-400">{quiz.lastDomainAnswer.correctAnswer}</p>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Team's Answer:</p>
                <p className="text-lg font-semibold text-blue-400">{quiz.lastDomainAnswer.answer}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Team: {quiz.teams.find((t: any) => t.id === quiz.lastDomainAnswer.teamId)?.name}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={async () => {
                    await evaluateDomainAnswer(quiz.id, quiz.lastDomainAnswer.teamId, quiz.currentQuestionId, 'correct');
                    router.refresh();
                  }}
                  className="py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
                >
                  <Check className="w-6 h-6" />
                  Correct (+10)
                </button>
                
                <button
                  onClick={async () => {
                    await evaluateDomainAnswer(quiz.id, quiz.lastDomainAnswer.teamId, quiz.currentQuestionId, 'partial');
                    router.refresh();
                  }}
                  className="py-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
                >
                  <Minus className="w-6 h-6" />
                  Partial (+5)
                </button>
                
                <button
                  onClick={async () => {
                    await evaluateDomainAnswer(quiz.id, quiz.lastDomainAnswer.teamId, quiz.currentQuestionId, 'incorrect');
                    router.refresh();
                  }}
                  className="py-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
                >
                  <X className="w-6 h-6" />
                  Incorrect (0)
                </button>
              </div>
            </div>
          )}
          
          {/* Buzzer Round - Awaiting Evaluation */}
          {quiz.phase === 'awaiting_evaluation' && quiz.round === 'buzzer' && quiz.pendingBuzzerAnswers && (
            <div className="space-y-4">
              <div className="bg-slate-800/70 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Question:</p>
                <p className="text-lg font-semibold">
                  {quiz.buzzerQuestions?.find((q: any) => q.id === quiz.currentQuestionId)?.text}
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Correct Answer:</p>
                <p className="text-lg font-semibold text-green-400">
                  {quiz.buzzerQuestions?.find((q: any) => q.id === quiz.currentQuestionId)?.answer}
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-slate-400">Submitted Answers (in buzz order):</p>
                {quiz.buzzSequence.map((teamId: string, index: number) => {
                  const teamAnswer = quiz.pendingBuzzerAnswers[teamId];
                  const team = quiz.teams.find((t: any) => t.id === teamId);
                  const isFirstBuzzer = index === 0;
                  
                  return (
                    <div key={teamId} className="bg-slate-800/70 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{team?.name}</p>
                          <p className="text-xs text-slate-400">
                            {isFirstBuzzer ? '1st Buzzer' : `${index + 1}${index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Buzzer`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Answer:</p>
                          <p className="text-lg font-semibold text-blue-400">{teamAnswer?.answer || 'No answer'}</p>
                        </div>
                      </div>
                      
                      {teamAnswer && (
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={async () => {
                              await evaluateBuzzerAnswer(quiz.id, teamId, 'correct');
                              router.refresh();
                            }}
                            className="py-2 bg-green-600 hover:bg-green-700 rounded font-semibold text-sm flex items-center justify-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            {isFirstBuzzer ? '+10' : '+5'}
                          </button>
                          
                          <button
                            onClick={async () => {
                              await evaluateBuzzerAnswer(quiz.id, teamId, 'partial');
                              router.refresh();
                            }}
                            className="py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-semibold text-sm flex items-center justify-center gap-1"
                          >
                            <Minus className="w-4 h-4" />
                            {isFirstBuzzer ? '+5' : '+2'}
                          </button>
                          
                          <button
                            onClick={async () => {
                              await evaluateBuzzerAnswer(quiz.id, teamId, 'incorrect');
                              router.refresh();
                            }}
                            className="py-2 bg-red-600 hover:bg-red-700 rounded font-semibold text-sm flex items-center justify-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            {isFirstBuzzer ? '-10' : '-5'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <button
                onClick={async () => {
                  await completeEvaluation(quiz.id);
                  router.refresh();
                }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-lg"
              >
                Complete Evaluation & Show Results
              </button>
            </div>
          )}
          
          {/* Next Question Button - Shows in showing_answer or showing_result phase */}
          {quiz.round === 'buzzer' && quiz.phase === 'showing_answer' && (
            <div className="text-center">
              <p className="text-slate-400 mb-4">Results are being shown to participants</p>
              <button
                onClick={async () => {
                  await nextBuzzerQuestion(quiz.id);
                  router.refresh();
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                Next Question
              </button>
            </div>
          )}
          
          {quiz.round === 'domain' && quiz.phase === 'showing_result' && (
            <div className="text-center">
              <p className="text-slate-400 mb-4">Results are being shown to participants</p>
              <button
                onClick={async () => {
                  await nextDomainQuestion(quiz.id);
                  router.refresh();
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                Next Question
              </button>
            </div>
          )}
          
          {/* Nothing to evaluate - Idle state */}
          {quiz.phase !== 'awaiting_evaluation' && quiz.phase !== 'showing_result' && quiz.phase !== 'showing_answer' && (
            <div className="text-center py-8">
              <div className="text-slate-400 text-lg">
                <p className="mb-2">💤 Nothing to evaluate right now</p>
                <p className="text-sm">Waiting for teams to submit answers...</p>
              </div>
            </div>
          )}
        </div>

        {/* Teams Display (Read-only with kick functionality) */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Teams ({quiz.teams.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {quiz.teams.map((team: any) => (
              <div key={team.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold">{team.name}</h3>
                    <div className="text-sm text-slate-400 mt-1">
                      Score: <span className="text-white font-semibold">{team.score}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-semibold ${
                    team.captainName 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-slate-500'
                  }`}>
                    {team.captainName ? 'Connected' : 'Waiting'}
                  </div>
                </div>
                
                {team.captainName && (
                  <div className="mt-3 flex justify-between items-center bg-slate-900/50 rounded p-2">
                    <div className="text-sm">
                      <span className="text-slate-400">Captain: </span>
                      <span className="font-semibold">{team.captainName}</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm(`Disconnect ${team.captainName} from ${team.name}?`)) {
                          await disconnectTeamCaptain(team.id);
                          router.refresh();
                        }
                      }}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm font-semibold"
                    >
                      Kick Player
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quiz Controls */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">🎯 Quiz Controls</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={async () => {
                await startDomainRound(quiz.id);
                router.refresh();
              }}
              className="py-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Domain Round
            </button>
            
            <button
              onClick={async () => {
                await startBuzzerRound(quiz.id);
                router.refresh();
              }}
              className="py-4 bg-amber-600 hover:bg-amber-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Buzzer Round
            </button>
            
            {quiz.status === 'active' && (quiz.round === 'domain' || quiz.round === 'buzzer') && (
              <button
                onClick={async () => {
                  await fetch('/api/pause-quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quizId: quiz.id })
                  });
                  router.refresh();
                }}
                className="py-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
              >
                <Pause className="w-5 h-5" />
                Pause Quiz
              </button>
            )}
            
            {quiz.status === 'paused' && (quiz.round === 'domain' || quiz.round === 'buzzer') && (
              <button
                onClick={async () => {
                  await fetch('/api/resume-quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quizId: quiz.id })
                  });
                  router.refresh();
                }}
                className="py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Resume Quiz
              </button>
            )}
            
            <button
              onClick={async () => {
                if (confirm('Reset quiz? This will clear all scores and progress.')) {
                  await resetQuiz(quiz.id);
                  router.refresh();
                }
              }}
              className="py-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset Quiz
            </button>
          </div>
        </div>

        {/* Game Statistics */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">📊 Game Statistics</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-sm text-slate-400">Total Teams</p>
              <p className="text-3xl font-bold mt-2">{quiz.teams.length}</p>
            </div>
            <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4">
              <p className="text-sm text-slate-400">Connected Players</p>
              <p className="text-3xl font-bold mt-2">
                {quiz.teams.filter((t: any) => t.captainName).length}
              </p>
            </div>
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
              <p className="text-sm text-slate-400">Domains</p>
              <p className="text-3xl font-bold mt-2">{quiz.domains.length}</p>
            </div>
            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4">
              <p className="text-sm text-slate-400">Buzzer Questions</p>
              <p className="text-3xl font-bold mt-2">{quiz.buzzerQuestions?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {quiz.teams.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">🏆 Leaderboard</h2>
            <div className="space-y-2">
              {[...quiz.teams]
                .sort((a: any, b: any) => b.score - a.score)
                .map((team: any, index: number) => (
                  <div 
                    key={team.id} 
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0 ? 'bg-yellow-500/20 border border-yellow-500' :
                      index === 1 ? 'bg-slate-400/20 border border-slate-400' :
                      index === 2 ? 'bg-orange-500/20 border border-orange-500' :
                      'bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold w-8">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{team.name}</div>
                        {team.captainName && (
                          <div className="text-sm text-slate-400">{team.captainName}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{team.score}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
