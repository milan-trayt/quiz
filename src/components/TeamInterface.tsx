'use client';

import { Clock, CheckCircle, XCircle, Award, Pause, Zap, Trophy, Timer, AlertCircle, Info, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as React from 'react';
import { createTeam, joinTeam, selectDomain, selectQuestion, submitDomainAnswer, showOptions, passQuestion, buzz, submitBuzzerAnswer } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

export default function TeamInterface({ quiz }: { quiz: any }) {
  const { socket, isConnected, hasReconnected } = useSocket(quiz.id);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [answer, setAnswer] = useState('');

  const [timeLeft, setTimeLeft] = useState(0);
  const [buzzTimeLeft, setBuzzTimeLeft] = useState(0);
  const [buzzTimerStart, setBuzzTimerStart] = useState<number | null>(null);
  const [myAnswerTimeLeft, setMyAnswerTimeLeft] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const router = useRouter();

  const isMyTurn = quiz.currentTeamId === selectedTeam;
  const hasBuzzed = quiz.buzzSequence?.includes(selectedTeam);

  useEffect(() => {
    const teamId = localStorage.getItem('teamId');
    const playerName = localStorage.getItem('playerName');
    
    if (teamId && playerName) {
      // First try to find by exact team ID
      let team = quiz.teams.find((t: any) => t.id === teamId);
      
      if (team) {
        // Team ID exists - check if player is still captain
        if (team.captainName === playerName) {
          setSelectedTeam(teamId);
          setJoined(true);
        } else {
          // Player is no longer captain of this team - clear team but keep player name
          localStorage.removeItem('teamId');
          setSelectedTeam('');
          setJoined(false);
          setPlayerName(playerName);
        }
      } else {
        // Team ID doesn't exist (might be reset) - try to find by team name and player name
        const storedTeamName = localStorage.getItem('teamName');
        if (storedTeamName) {
          team = quiz.teams.find((t: any) => t.name === storedTeamName && t.captainName === playerName);
          if (team) {
            // Found matching team by name and player - update stored team ID
            localStorage.setItem('teamId', team.id);
            setSelectedTeam(team.id);
            setJoined(true);
            setToast({
              message: 'Reconnected to your team after quiz reset.',
              type: 'success'
            });
          } else {
            // No matching team found - clear team but keep player name
            localStorage.removeItem('teamId');
            localStorage.removeItem('teamName');
            setSelectedTeam('');
            setJoined(false);
            setPlayerName(playerName);
          }
        } else {
          // No team name stored - clear team but keep player name
          localStorage.removeItem('teamId');
          setSelectedTeam('');
          setJoined(false);
          setPlayerName(playerName);
        }
      }
    } else if (playerName) {
      // Player name exists but no team - restore player name for easy team selection
      setPlayerName(playerName);
    }
  }, [quiz.teams, quiz.status, quiz.phase]);

  // Handle reconnection - validate localStorage against server state
  useEffect(() => {
    if (hasReconnected) {
      console.log('Reconnected - validating localStorage against server state');
      const teamId = localStorage.getItem('teamId');
      const playerName = localStorage.getItem('playerName');
      const teamName = localStorage.getItem('teamName');
      
      if (teamId && playerName) {
        let team = quiz.teams.find((t: any) => t.id === teamId);
        
        if (!team && teamName) {
          // Try to find by team name if ID doesn't match (quiz might have been reset)
          team = quiz.teams.find((t: any) => t.name === teamName && t.captainName === playerName);
          if (team) {
            // Update stored team ID
            localStorage.setItem('teamId', team.id);
            setSelectedTeam(team.id);
            setJoined(true);
            setToast({
              message: 'Reconnected to your team.',
              type: 'success'
            });
            return;
          }
        }
        
        if (!team || team.captainName !== playerName) {
          // Server state doesn't match localStorage - clear team but keep player name
          localStorage.removeItem('teamId');
          localStorage.removeItem('teamName');
          setSelectedTeam('');
          setJoined(false);
          setPlayerName(playerName); // Keep the player name
          setToast({
            message: 'Connection restored. Please select your team again.',
            type: 'error'
          });
        }
      }
    }
  }, [hasReconnected, quiz.teams]);

  // Reset client state when quiz is reset or restarted
  useEffect(() => {
    // If quiz status changes to 'setup' or teams are empty, it likely means quiz was reset
    if (quiz.status === 'setup' || quiz.teams.length === 0) {
      // Keep team and player info, just reset quiz-specific state
      setHasSubmitted(false);
      setIsSubmitting(false);
      setAnswer('');
      
      // Show friendly message that quiz was reset but they're still in their team
      const teamId = localStorage.getItem('teamId');
      const playerName = localStorage.getItem('playerName');
      if (teamId && playerName) {
        setToast({
          message: 'Quiz was reset. You remain in your team.',
          type: 'success'
        });
      }
    }
  }, [quiz.status, quiz.teams.length]);

  // Track when buzzing phase starts for 10-second buzz timer
  useEffect(() => {
    if (quiz.round === 'buzzer' && quiz.phase === 'buzzing' && quiz.currentQuestionId) {
      setBuzzTimerStart(Date.now());
      setBuzzTimeLeft(10);
      setHasSubmitted(false);
      setIsSubmitting(false);
      setAnswer('');
    } else if (quiz.phase === 'answering' && buzzTimerStart) {
      // Keep buzz timer running during answering phase
      const elapsed = Math.floor((Date.now() - buzzTimerStart) / 1000);
      setBuzzTimeLeft(Math.max(0, 10 - elapsed));
    } else {
      setBuzzTimerStart(null);
      setBuzzTimeLeft(0);
      setIsSubmitting(false);
    }
  }, [quiz.phase, quiz.currentQuestionId, quiz.round]);

  // Track individual team's 20-second answer timer
  useEffect(() => {
    if (hasBuzzed && quiz.buzzTimers && quiz.buzzTimers[selectedTeam]) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((quiz.buzzTimers[selectedTeam] - Date.now()) / 1000));
        setMyAnswerTimeLeft(remaining);
        
        // Show timeout toast and disable submit when timer expires
        if (remaining === 0 && !hasSubmitted) {
          setHasSubmitted(true);
          if (quiz.phase === 'answering') {
            setToast({
              message: 'Timeout! You did not submit an answer.',
              type: 'error'
            });
          }
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      setMyAnswerTimeLeft(0);
    }
  }, [hasBuzzed, quiz.buzzTimers, selectedTeam, hasSubmitted, quiz.phase]);

  // Buzz timer countdown
  useEffect(() => {
    if (buzzTimerStart && buzzTimeLeft > 0) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - buzzTimerStart) / 1000);
        const remaining = Math.max(0, 10 - elapsed);
        setBuzzTimeLeft(remaining);
        
        // Only trigger expiry if still in buzzing phase and no one has buzzed
        if (remaining === 0 && quiz.phase === 'buzzing' && quiz.buzzSequence.length === 0) {
          // Let the server handle buzz timer expiry through the periodic check
          // No need to manually trigger it from client
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [buzzTimerStart, buzzTimeLeft, quiz.phase, quiz.id, quiz.buzzSequence]);

  // Check buzzer timers periodically
  useEffect(() => {
    if (quiz.round === 'buzzer' && (quiz.phase === 'buzzing' || quiz.phase === 'answering' || quiz.phase === 'processing_answers')) {
      const interval = setInterval(() => {
        // Use API endpoint instead of dynamic import
        fetch('/api/check-buzzer-timers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: quiz.id })
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quiz.round, quiz.phase, quiz.id]);

  // Show results when moving to showing_answer phase
  useEffect(() => {
    if (quiz.round === 'buzzer' && quiz.phase === 'showing_answer' && quiz.lastRoundResults) {
      const myResult = quiz.lastRoundResults[selectedTeam];
      if (myResult && hasBuzzed) {
        if (myResult.timeout) {
          setToast({
            message: `Timeout! ${myResult.points} points`,
            type: 'error'
          });
        } else if (myResult.isCorrect) {
          setToast({
            message: `Correct! +${myResult.points} points`,
            type: 'success'
          });
        } else {
          setToast({
            message: `Wrong! ${myResult.points} points`,
            type: 'error'
          });
        }
      }
    }
  }, [quiz.phase, quiz.lastRoundResults, selectedTeam, hasBuzzed, quiz.round]);

  useEffect(() => {
    if (quiz.timerEndsAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(quiz.timerEndsAt).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);
        
        // Show toast when timer expires for current team
        if (remaining === 0 && isMyTurn && (quiz.phase === 'answering' || quiz.phase === 'answering_with_options') && quiz.round === 'domain') {
          setToast({
            message: 'Timeout! Question passed.',
            type: 'error'
          });
        }
        
        // Handle showing_result timer (domain round)
        if (remaining === 0 && quiz.phase === 'showing_result' && quiz.round === 'domain') {
          fetch('/api/timer-expiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizId: quiz.id })
          });
        }
        
        // Handle buzzer showing answer timer
        if (remaining === 0 && quiz.phase === 'showing_answer' && quiz.round === 'buzzer') {
          // Let the server handle this through periodic checks
          fetch('/api/buzzer-timer-expiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizId: quiz.id })
          });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quiz.timerEndsAt, isMyTurn, quiz.phase, quiz.round, quiz.id]);

  // Periodic check for domain round timer expiry (server-side) - works regardless of whose turn it is
  useEffect(() => {
    if (quiz.round === 'domain' && (quiz.phase === 'answering' || quiz.phase === 'answering_with_options')) {
      const interval = setInterval(() => {
        fetch('/api/check-domain-timers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: quiz.id })
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quiz.round, quiz.phase, quiz.id]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await joinTeam(quiz.id, selectedTeam, playerName);
    if (result.success) {
      const team = quiz.teams.find((t: any) => t.id === selectedTeam);
      localStorage.setItem('teamId', selectedTeam);
      localStorage.setItem('playerName', playerName);
      if (team) {
        localStorage.setItem('teamName', team.name); // Store team name for reset recovery
      }
      setJoined(true);
    }
  };



  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Join Team</h1>
          <form onSubmit={handleJoinTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:outline-none focus:border-emerald-500 transition-colors text-white"
                  required
                >
                  <option value="" className="bg-gray-800">Choose a team</option>
                  {quiz.teams.map((team: any) => (
                    <option key={team.id} value={team.id} className="bg-gray-800">
                      {team.name} {team.captainName ? '(Joined)' : '(Available)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg font-semibold">
                Join Team
              </button>
            </form>
        </div>
      </div>
    );
  }

  const team = quiz.teams.find((t: any) => t.id === selectedTeam);
  const currentQuestion = quiz.round === 'domain' 
    ? quiz.domains?.flatMap((d: any) => d.questions).find((q: any) => q.id === quiz.currentQuestionId)
    : quiz.buzzerQuestions?.find((q: any) => q.id === quiz.currentQuestionId);
  const availableDomains = quiz.domains?.filter((d: any) => !quiz.usedDomains?.includes(d.id));

  return (
    <div className="min-h-screen p-4">
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg font-semibold ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} z-50`}>
          {toast.message}
        </div>
      )}
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <div className="mb-2">
            <h1 className="text-3xl font-bold">{team?.name}</h1>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xl">Score: {team?.score}</div>
            <div className="text-sm text-slate-400">Captain: {team?.captainName || 'Not joined'}</div>
          </div>
        </div>

        {/* QUIZ COMPLETED */}
        {quiz.status === 'active' && quiz.phase === 'completed' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-4xl font-bold mb-4">Quiz Completed!</h2>
              <p className="text-slate-400 text-lg mb-4">Thank you for participating!</p>
              <p className="text-purple-300 text-xl">📺 Check the main screen for final results</p>
            </div>
          </div>
        )}

        {/* AWAITING EVALUATION */}
        {quiz.round === 'domain' && quiz.status === 'active' && quiz.phase === 'awaiting_evaluation' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="text-center py-8">
              <div className="inline-block p-4 bg-purple-500/20 rounded-full mb-4">
                <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-2">⚖️ Host is Evaluating...</h2>
              <p className="text-slate-400 text-lg">Please wait while the host reviews your answer</p>
              <p className="text-purple-300 text-sm mt-4">📺 Watch the main screen for the question and options</p>
            </div>
          </div>
        )}

        {/* SHOWING RESULT */}
        {quiz.round === 'domain' && quiz.status === 'active' && quiz.phase === 'showing_result' && quiz.lastDomainAnswer && quiz.lastDomainAnswer.questionCompleted && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="space-y-6">
              {/* Question */}
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Question</h2>
                <div className="text-2xl text-white/90 bg-blue-500/20 border border-blue-500 rounded-lg p-6">
                  {quiz.lastDomainAnswer.questionText}
                </div>
              </div>

              {/* Correct Answer */}
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-3 text-green-400">Correct Answer</h3>
                <div className="text-xl text-green-300 bg-green-500/20 border border-green-500 rounded-lg p-4">
                  {quiz.lastDomainAnswer.correctAnswer}
                </div>
              </div>

              {/* All Team Answers */}
              {quiz.lastDomainAnswer.allAnswers && quiz.lastDomainAnswer.allAnswers.length > 0 && quiz.lastDomainAnswer.questionCompleted && (
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-4">Team Answers</h3>
                  <div className="space-y-2">
                    {quiz.lastDomainAnswer.allAnswers.map((teamAnswer: any) => (
                      <div 
                        key={teamAnswer.teamId}
                        className={`text-lg ${
                          teamAnswer.isPassed
                            ? 'text-red-300'
                            : teamAnswer.isCorrect 
                              ? 'text-green-300' 
                              : 'text-red-300'
                        }`}
                      >
                        <span className="font-semibold">{teamAnswer.teamName}:</span>
                        {teamAnswer.isPassed ? (
                          <span className="ml-2">PASSED</span>
                        ) : teamAnswer.isTimeout ? (
                          <span className="ml-2 text-orange-400">TIMEOUT</span>
                        ) : teamAnswer.answer ? (
                          <span className="ml-2">"{teamAnswer.answer}"</span>
                        ) : (
                          <span className="ml-2">No answer</span>
                        )}
                        <span className="ml-2 text-sm opacity-75">
                          ({teamAnswer.points > 0 ? '+' : ''}{teamAnswer.points} pts)
                        </span>
                        {!teamAnswer.wasTabActive && (
                          <span className="ml-2 text-xs text-yellow-400">⚠ Tab inactive</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timer */}
              {timeLeft > 0 && (
                <div className="text-center text-white/70 text-sm">
                  Next in {timeLeft}s...
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOMAIN ROUND ENDED */}
        {quiz.round === 'domain' && quiz.status === 'active' && quiz.phase === 'domain_round_ended' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold mb-4">Domain Round Ended!</h2>
              <p className="text-slate-400 text-lg">Waiting for host to start Buzzer Round...</p>
            </div>
          </div>
        )}

        {/* DOMAIN ROUND - DOMAIN SELECTION */}
        {quiz.round === 'domain' && quiz.status === 'active' && quiz.phase === 'selecting_domain' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            {!isMyTurn ? (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4">Waiting...</h2>
                <p className="text-slate-400">
                  {quiz.teams.find((t: any) => t.id === quiz.currentTeamId)?.name} is selecting domain
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Select Domain</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableDomains?.map((domain: any) => (
                    <button
                      key={domain.id}
                      onClick={() => selectDomain(quiz.id, domain.id)}
                      className="p-6 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-lg"
                    >
                      {domain.name}
                      <div className="text-sm text-slate-300 mt-2">{domain.questions.filter((q: any) => !q.isAnswered).length} questions</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* DOMAIN ROUND - QUESTION SELECTION */}
        {quiz.round === 'domain' && quiz.status === 'active' && quiz.phase === 'selecting_question' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            {!isMyTurn ? (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4">Waiting...</h2>
                <p className="text-slate-400">
                  {quiz.teams.find((t: any) => t.id === quiz.currentTeamId)?.name} is selecting question
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Select Question</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quiz.domains.find((d: any) => d.id === quiz.selectedDomainId)?.questions.map((q: any) => (
                    <button
                      key={q.id}
                      onClick={() => selectQuestion(quiz.id, q.id, selectedTeam)}
                      disabled={q.isAnswered}
                      className={`p-6 rounded-lg font-bold text-2xl ${
                        q.isAnswered ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {q.number}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* DOMAIN ROUND - ANSWERING */}
        {quiz.round === 'domain' && quiz.status === 'active' && (quiz.phase === 'answering' || quiz.phase === 'answering_with_options') && currentQuestion && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Question #{currentQuestion.number}</h2>
              {isMyTurn && timeLeft > 0 && (
                <div className={`text-3xl font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-green-500'}`}>
                  {timeLeft}s
                </div>
              )}
            </div>
            
            {/* Instruction to look at spectator screen */}
            <div className="bg-purple-500/20 border border-purple-400 rounded-lg p-4 mb-4 text-center">
              <p className="text-lg font-semibold text-purple-300">📺 Look at the main screen for the question!</p>
              {currentQuestion.passedFrom && (
                <p className="text-sm text-yellow-400 mt-2">⚠️ Passed question</p>
              )}
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!isMyTurn || isSubmitting) return;
              
              setIsSubmitting(true);
              try {
                const result = await submitDomainAnswer(quiz.id, selectedTeam, currentQuestion.id, answer, quiz.phase === 'answering_with_options');
                if (result.success) {
                  if (result.needsEvaluation) {
                    setToast({
                      message: 'Answer submitted! Waiting for host evaluation...',
                      type: 'success'
                    });
                  }
                } else if (result.error) {
                  setToast({
                    message: ` ${result.error}`,
                    type: 'error'
                  });
                }
                setAnswer('');
              } finally {
                setIsSubmitting(false);
              }
            }} className="space-y-4">
              
              {/* Show text input only when options are NOT shown */}
              {quiz.phase !== 'answering_with_options' && (
                <>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder={isMyTurn ? "Type your answer..." : "Type your answer (wait for your turn to submit)..."}
                    rows={4}
                  />
                  {!isMyTurn && (
                    <div className="text-center text-sm text-yellow-400">
                      Waiting for {quiz.teams.find((t: any) => t.id === quiz.currentTeamId)?.name} to answer...
                    </div>
                  )}
                </>
              )}
              
              {/* Show option buttons when options are shown */}
              {quiz.phase === 'answering_with_options' && currentQuestion.options.length > 0 && (
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-center text-white">Select your answer:</p>
                  {!isMyTurn && (
                    <div className="text-center text-sm text-yellow-400 mb-2">
                      Waiting for {quiz.teams.find((t: any) => t.id === quiz.currentTeamId)?.name} to answer...
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.options.map((opt: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        disabled={!isMyTurn || isSubmitting}
                        onClick={async () => {
                          if (isSubmitting) return;
                          setIsSubmitting(true);
                          try {
                            const result = await submitDomainAnswer(quiz.id, selectedTeam, currentQuestion.id, opt, true);
                            if (result.success) {
                              if (result.needsEvaluation) {
                                setToast({
                                  message: 'Answer submitted! Waiting for host evaluation...',
                                  type: 'success'
                                });
                              }
                            } else if (result.error) {
                              setToast({
                                message: ` ${result.error}`,
                                type: 'error'
                              });
                            }
                            setAnswer('');
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="py-8 bg-slate-800/50 hover:bg-green-600 rounded-lg text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-4xl font-bold"
                      >
                        {String.fromCharCode(65 + i)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Control buttons - only show when options are NOT shown */}
              {quiz.phase !== 'answering_with_options' && (
                <div className="flex gap-4">
                  {!currentQuestion.optionsViewed && !currentQuestion.optionsDefault && (
                    <button
                      type="button"
                      disabled={!isMyTurn}
                      onClick={async () => {
                        const result = await passQuestion(quiz.id, currentQuestion.id, selectedTeam);
                        if (result.success) {
                          setToast({ message: 'Question passed', type: 'success' });
                        }
                      }}
                      className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Pass
                    </button>
                  )}
                  {currentQuestion.options.length > 0 && !currentQuestion.optionsViewed && !currentQuestion.optionsDefault && (
                    <button
                      type="button"
                      disabled={!isMyTurn}
                      onClick={() => showOptions(quiz.id, currentQuestion.id)}
                      className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Show Options (5/-5)
                    </button>
                  )}
                  <button type="submit" disabled={!isMyTurn || isSubmitting} className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Submitting...' : 
                      currentQuestion.optionsDefault ? 'Submit (10/-5)' : 'Submit (10)'
                    }
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* QUIZ PAUSED */}
        {quiz.status === 'paused' && (quiz.round === 'domain' || quiz.round === 'buzzer') && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold mb-4">Quiz Paused</h2>
              <p className="text-slate-400 text-lg">Waiting for host to resume...</p>
            </div>
          </div>
        )}

        {/* BUZZER ROUND */}
        {quiz.round === 'buzzer' && quiz.status === 'active' && quiz.phase !== 'completed' && currentQuestion && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Question #{currentQuestion.number}</h2>
            </div>
            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4 mb-4">
              <p className="text-lg">{currentQuestion.text}</p>
            </div>

            {hasBuzzed && quiz.buzzSequence && quiz.buzzSequence.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium mb-2">Buzz Sequence:</p>
                <div className="flex gap-2 flex-wrap">
                  {quiz.buzzSequence.map((teamId: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                      {i + 1}. {quiz.teams.find((t: any) => t.id === teamId)?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(quiz.phase === 'buzzing' || quiz.phase === 'answering') && !hasBuzzed && buzzTimeLeft > 0 && (
              <>
                <div className="text-center mb-2 text-yellow-400 font-semibold">
                  Buzz Time: {buzzTimeLeft}s
                </div>
                <button
                  onClick={() => buzz(quiz.id, selectedTeam)}
                  className="w-full py-6 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-2xl"
                >
                  BUZZ!
                </button>
              </>
            )}
            
            {(quiz.phase === 'buzzing' || quiz.phase === 'answering') && !hasBuzzed && buzzTimeLeft === 0 && (
              <div className="text-center py-4 text-slate-500">
                Buzz time expired
              </div>
            )}

            {quiz.phase === 'showing_answer' && (
              <>
                <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-6 text-center mb-4">
                  <h3 className="text-xl font-bold mb-2">Correct Answer:</h3>
                  <p className="text-2xl font-bold text-green-400">{currentQuestion.answer}</p>
                  <p className="text-sm text-slate-400 mt-4">Next question in {timeLeft}s...</p>
                </div>
                
                
                {/* Round Results */}
                {quiz.lastRoundResults && Object.keys(quiz.lastRoundResults).length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-bold mb-3 text-center">Round Results</h3>
                    <div className="space-y-2">
                      {Object.entries(quiz.lastRoundResults).map(([teamId, result]: [string, any], i: number) => {
                        const team = quiz.teams.find((t: any) => t.id === teamId);
                        
                        let points = result.points || 0;
                        let status = 'No Answer';
                        let statusColor = 'text-slate-500';
                        
                        if (result.timeout) {
                          status = ' Timeout';
                          statusColor = 'text-yellow-400';
                        } else if (result.isCorrect) {
                          status = ' Correct';
                          statusColor = 'text-green-400';
                        } else if (result.answer) {
                          status = ' Wrong';
                          statusColor = 'text-red-400';
                        }
                        
                        return (
                          <div key={teamId} className="flex justify-between items-center bg-slate-900/30 rounded p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500">#{i + 1}</span>
                              <span className="font-semibold">{team?.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm ${statusColor}`}>{status}</span>
                              <span className={`font-bold ${points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {points > 0 ? '+' : ''}{points}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {hasBuzzed && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (hasSubmitted || isSubmitting) return;
                
                setIsSubmitting(true);
                try {
                  const result = await submitBuzzerAnswer(quiz.id, selectedTeam, currentQuestion.id, answer);
                  if (result.success && result.queued) {
                    setHasSubmitted(true);
                    setToast({
                      message: 'Answer queued! Results will be shown after all answers are processed.',
                      type: 'success'
                    });
                    setAnswer('');
                  } else if (result.error) {
                    setToast({
                      message: result.error,
                      type: 'error'
                    });
                  }
                } finally {
                  setIsSubmitting(false);
                }
              }} className="space-y-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder={hasSubmitted ? "Answer submitted!" : "Type your answer..."}
                  rows={4}
                  disabled={hasSubmitted}
                />
                {hasSubmitted ? (
                  <div className="text-center text-sm text-blue-400">
                    ✓ Answer submitted! Waiting for results...
                  </div>
                ) : myAnswerTimeLeft === 0 ? (
                  <div className="text-center text-sm text-red-400">
                    ⏰ Time expired! Cannot submit answer.
                  </div>
                ) : (
                  <div className="text-center text-sm text-green-400">
                    ✓ You buzzed! Submit your answer ({myAnswerTimeLeft}s left)
                  </div>
                )}
                <button 
                  type="submit"
                  disabled={hasSubmitted || myAnswerTimeLeft === 0 || isSubmitting}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : hasSubmitted ? 'Submitted' : myAnswerTimeLeft === 0 ? 'Timeout' : 'Submit Answer'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
