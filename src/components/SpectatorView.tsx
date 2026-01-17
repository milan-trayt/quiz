'use client';

import { Clock, CheckCircle, XCircle, Award, Pause, Zap, Trophy, Timer, Eye, BookOpen, HelpCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Quiz {
  id: string;
  status: string;
  round: string;
  phase: string;
  currentTeamId: string | null;
  currentQuestionId: string | null;
  selectedDomainId: string | null;
  timerEndsAt: string | null;
  buzzSequence: string[];
  teams: Team[];
  domains: Domain[];
  buzzerQuestions: BuzzerQuestion[];
  lastRoundResults?: any;
  lastDomainAnswer?: any;
}

interface Team {
  id: string;
  name: string;
  captainName: string | null;
  score: number;
  sequence: number;
}

interface Domain {
  id: string;
  name: string;
  questions: Question[];
}

interface Question {
  id: string;
  number: number;
  text: string;
  answer: string;
  options: string[];
  isAnswered: boolean;
  selectedBy: string | null;
  correctAnswer: string | null;
  passedFrom: string | null;
  optionsViewed?: boolean;
  optionsDefault?: boolean;
}

interface BuzzerQuestion {
  id: string;
  number: number;
  text: string;
  answer: string;
  options: string[];
  isAnswered: boolean;
}

export default function SpectatorView({ quiz: initialQuiz }: { quiz: Quiz }) {
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [commentaryEnabled, setCommentaryEnabled] = useState(false);
  const [lastCommentary, setLastCommentary] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('en-US');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const voices = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'en-AU', name: 'English (Australia)' },
    { code: 'en-IN', name: 'English (India)' },
    { code: 'en-CA', name: 'English (Canada)' },
    { code: 'en-IE', name: 'English (Ireland)' },
    { code: 'en-ZA', name: 'English (South Africa)' },
    { code: 'en-NZ', name: 'English (New Zealand)' },
    { code: 'en-SG', name: 'English (Singapore)' },
  ];

  const speakText = async (text: string) => {
    if (!commentaryEnabled) {
      console.log('Commentary disabled');
      return;
    }
    if (text === lastCommentary) {
      console.log('Duplicate commentary:', text);
      return;
    }
    setLastCommentary(text);
    
    console.log('Speaking:', text);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${selectedVoice}`;
      console.log('Audio URL:', audioUrl);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      await audio.play();
      console.log('Audio playing');
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    const socketInstance = io(socketUrl);
    console.log('Spectator socket initialized:', socketUrl);
    
    socketInstance.emit('join-quiz', quiz.id);
    console.log('Spectator joined quiz:', quiz.id);
    
    const handleUpdate = () => {
      console.log('Spectator received quiz-update, refreshing...');
      router.refresh();
    };
    
    socketInstance.on('quiz-update', handleUpdate);
    
    return () => {
      socketInstance.off('quiz-update', handleUpdate);
      socketInstance.disconnect();
    };
  }, [quiz.id, router]);

  // Periodic check for domain round timer expiry (server-side)
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
    const prevQuiz = quiz;
    setQuiz(initialQuiz);

    if (!commentaryEnabled) return;

    // Domain selection
    if (initialQuiz.round === 'domain' && initialQuiz.phase === 'selecting_domain') {
      const team = initialQuiz.teams.find(t => t.id === initialQuiz.currentTeamId);
      if (team && prevQuiz.phase !== 'selecting_domain') {
        speakText(`${team.name} selecting domain`);
      }
    }

    // Domain selected
    if (initialQuiz.round === 'domain' && initialQuiz.phase === 'selecting_question' && prevQuiz.phase === 'selecting_domain') {
      const domain = initialQuiz.domains.find(d => d.id === initialQuiz.selectedDomainId);
      const team = initialQuiz.teams.find(t => t.id === initialQuiz.currentTeamId);
      if (domain && team) {
        speakText(`${team.name} selected ${domain.name}. Select a question`);
      }
    }

    // Question selection phase (after showing result)
    if (initialQuiz.round === 'domain' && initialQuiz.phase === 'selecting_question' && prevQuiz.phase === 'showing_result') {
      const team = initialQuiz.teams.find(t => t.id === initialQuiz.currentTeamId);
      if (team) {
        speakText(`${team.name}, select a question`);
      }
    }

    // Question selected
    if (initialQuiz.round === 'domain' && (initialQuiz.phase === 'answering' || initialQuiz.phase === 'answering_with_options') && prevQuiz.phase === 'selecting_question') {
      const domain = initialQuiz.domains.find(d => d.id === initialQuiz.selectedDomainId);
      const question = domain?.questions.find(q => q.id === initialQuiz.currentQuestionId);
      const team = initialQuiz.teams.find(t => t.id === initialQuiz.currentTeamId);
      if (question && team) {
        speakText(`${team.name} selected question ${question.number}`);
      }
    }

    // Options shown
    if (initialQuiz.round === 'domain' && initialQuiz.phase === 'answering_with_options' && prevQuiz.phase === 'answering') {
      const team = initialQuiz.teams.find(t => t.id === initialQuiz.currentTeamId);
      if (team) {
        speakText(`${team.name} viewed options`);
      }
    }

    // Answer result
    if (initialQuiz.round === 'domain' && initialQuiz.phase === 'showing_result' && initialQuiz.lastDomainAnswer?.questionCompleted) {
      const team = initialQuiz.teams.find(t => t.id === initialQuiz.lastDomainAnswer.teamId);
      if (team) {
        if (initialQuiz.lastDomainAnswer.isCorrect) {
          const withOptions = initialQuiz.lastDomainAnswer.withOptions ? 'with options' : 'without options';
          speakText(`Correct by ${team.name} ${withOptions}! ${initialQuiz.lastDomainAnswer.points} points`);
        } else {
          speakText(`No correct answer`);
        }
      }
    }

    // Question passed
    if (initialQuiz.round === 'domain' && initialQuiz.phase === 'answering' && prevQuiz.currentTeamId !== initialQuiz.currentTeamId && prevQuiz.phase === 'answering') {
      const team = initialQuiz.teams.find(t => t.id === initialQuiz.currentTeamId);
      if (team) {
        speakText(`Passed to ${team.name}`);
      }
    }

    // Buzzer round
    if (initialQuiz.round === 'buzzer' && initialQuiz.phase === 'buzzing' && prevQuiz.round !== 'buzzer') {
      speakText('Buzzer round started');
    }

    // Team buzzed
    if (initialQuiz.round === 'buzzer' && initialQuiz.buzzSequence.length > prevQuiz.buzzSequence?.length) {
      const newTeamId = initialQuiz.buzzSequence[initialQuiz.buzzSequence.length - 1];
      const team = initialQuiz.teams.find(t => t.id === newTeamId);
      if (team) {
        speakText(`${team.name} buzzed!`);
      }
    }

    // Buzzer answer results
    if (initialQuiz.round === 'buzzer' && initialQuiz.phase === 'showing_answer' && prevQuiz.phase !== 'showing_answer') {
      const results = initialQuiz.lastRoundResults || {};
      const correctTeam = Object.entries(results).find(([_, result]: [string, any]) => result.isCorrect);
      if (correctTeam) {
        const team = initialQuiz.teams.find(t => t.id === correctTeam[0]);
        if (team) {
          speakText(`Correct by ${team.name}!`);
        }
      } else {
        speakText('No correct answers');
      }
    }

    // Quiz complete
    if (initialQuiz.phase === 'completed' && prevQuiz.phase !== 'completed') {
      const winner = [...initialQuiz.teams].sort((a, b) => b.score - a.score)[0];
      if (winner) {
        speakText(`Quiz complete! ${winner.name} wins with ${winner.score} points!`);
      }
    }
  }, [initialQuiz, commentaryEnabled]);

  useEffect(() => {
    if (!quiz.timerEndsAt) {
      setTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(quiz.timerEndsAt!).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && quiz.phase === 'showing_result' && quiz.round === 'domain') {
        console.log('Timer expired, calling API');
        fetch('/api/timer-expiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: quiz.id })
        }).then(() => console.log('Timer expiry handled'));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [quiz.timerEndsAt, quiz.phase, quiz.round, quiz.id]);

  const currentTeam = quiz.teams.find(t => t.id === quiz.currentTeamId);
  const currentDomain = quiz.domains.find(d => d.id === quiz.selectedDomainId);
  const currentQuestion = currentDomain?.questions.find(q => q.id === quiz.currentQuestionId);
  const currentBuzzerQuestion = quiz.buzzerQuestions.find(q => q.id === quiz.currentQuestionId);
  const sortedTeams = [...quiz.teams].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2"> Quiz Spectator</h1>
              <p className="text-white/70">
                {quiz.round === 'domain' ? ' Domain Round' : quiz.round === 'buzzer' ? ' Buzzer Round' : ' Waiting'}
                {quiz.phase && ` • ${quiz.phase.replace(/_/g, ' ')}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {commentaryEnabled && (
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {voices.map(voice => (
                    <option key={voice.code} value={voice.code}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setCommentaryEnabled(!commentaryEnabled)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  commentaryEnabled 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white/70'
                }`}
              >
                {commentaryEnabled ? '🔊 Commentary ON' : '🔇 Commentary OFF'}
              </button>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-full ${quiz.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                <span className="text-white font-semibold">{quiz.status === 'active' ? 'Live' : 'Paused'}</span>
              </div>
              {timeLeft !== null && timeLeft > 0 && (
                <div className="mt-2 text-2xl font-bold text-white"><Clock className="inline w-6 h-6 mr-1" />{timeLeft}s</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Domain Round - Selecting Domain */}
            {quiz.round === 'domain' && quiz.phase === 'selecting_domain' && (
              <div className="space-y-4">
                {quiz.lastDomainAnswer && quiz.lastDomainAnswer.teamId && quiz.lastDomainAnswer.questionCompleted && (
                  <div className={`p-4 rounded-xl border-2 ${
                    quiz.lastDomainAnswer.isCorrect 
                      ? 'bg-green-500/20 border-green-400' 
                      : 'bg-red-500/20 border-red-400'
                  }`}>
                    <div className="text-white/70 text-sm mb-2">Last Answer:</div>
                    {quiz.lastDomainAnswer.questionText && (
                      <div className="text-white/80 text-sm mb-2 italic">"{quiz.lastDomainAnswer.questionText}"</div>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        {quiz.lastDomainAnswer.isCorrect ? (
                          <>
                            <span className="text-white font-bold text-lg">
                              {quiz.teams.find((t: Team) => t.id === quiz.lastDomainAnswer.teamId)?.name}:
                            </span>
                            <span className="text-green-300 ml-2 font-semibold">
                              {quiz.lastDomainAnswer.correctAnswer}
                            </span>
                          </>
                        ) : (
                          <span className="text-green-300 font-semibold">
                            Correct Answer: {quiz.lastDomainAnswer.correctAnswer}
                          </span>
                        )}
                      </div>
                      <span className={`font-bold text-xl ${
                        quiz.lastDomainAnswer.isCorrect ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {quiz.lastDomainAnswer.points > 0 ? '+' : ''}{quiz.lastDomainAnswer.points} pts
                      </span>
                    </div>
                  </div>
                )}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-8 border border-slate-700/50 text-center">
                  <div className="text-6xl mb-4"><BookOpen className="inline w-16 h-16" /></div>
                  <h2 className="text-3xl font-bold text-white mb-4">Selecting Domain</h2>
                  <p className="text-xl text-yellow-400 font-semibold">{currentTeam?.name} is choosing a domain...</p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {quiz.domains.map(domain => (
                      <div key={domain.id} className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/50">
                        <div className="text-lg font-semibold text-white">{domain.name}</div>
                        <div className="text-sm text-white/60">{domain.questions.length} questions</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Domain Round - Selecting Question */}
            {quiz.round === 'domain' && quiz.phase === 'selecting_question' && currentDomain && (
              <div className="space-y-4">
                {quiz.lastDomainAnswer && quiz.lastDomainAnswer.teamId && quiz.lastDomainAnswer.questionCompleted && (
                  <div className={`p-4 rounded-xl border-2 ${
                    quiz.lastDomainAnswer.isCorrect 
                      ? 'bg-green-500/20 border-green-400' 
                      : 'bg-red-500/20 border-red-400'
                  }`}>
                    <div className="text-white/70 text-sm mb-2">Last Answer:</div>
                    {quiz.lastDomainAnswer.questionText && (
                      <div className="text-white/80 text-sm mb-2 italic">"{quiz.lastDomainAnswer.questionText}"</div>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        {quiz.lastDomainAnswer.isCorrect ? (
                          <>
                            <span className="text-white font-bold text-lg">
                              {quiz.teams.find((t: Team) => t.id === quiz.lastDomainAnswer.teamId)?.name}:
                            </span>
                            <span className="text-green-300 ml-2 font-semibold">
                              {quiz.lastDomainAnswer.correctAnswer}
                            </span>
                          </>
                        ) : (
                          <span className="text-green-300 font-semibold">
                            Correct Answer: {quiz.lastDomainAnswer.correctAnswer}
                          </span>
                        )}
                      </div>
                      <span className={`font-bold text-xl ${
                        quiz.lastDomainAnswer.isCorrect ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {quiz.lastDomainAnswer.points > 0 ? '+' : ''}{quiz.lastDomainAnswer.points} pts
                      </span>
                    </div>
                  </div>
                )}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-8 border border-slate-700/50 text-center">
                  <div className="text-6xl mb-4"><HelpCircle className="inline w-16 h-16" /></div>
                  <h2 className="text-3xl font-bold text-white mb-2">Selecting Question</h2>
                  <p className="text-lg text-white/70 mb-4">Domain: <span className="text-white font-bold">{currentDomain.name}</span></p>
                  <p className="text-xl text-yellow-400 font-semibold">{currentTeam?.name} is choosing a question...</p>
                  <div className="grid grid-cols-5 gap-3 mt-6">
                    {currentDomain.questions.map(q => (
                      <div key={q.id} className={`p-4 rounded-lg font-bold text-xl ${
                        q.isAnswered ? 'bg-gray-600 text-slate-500' : 'bg-blue-500 text-white'
                      }`}>
                        {q.number}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Domain Round - Answering */}
            {quiz.round === 'domain' && (quiz.phase === 'answering' || quiz.phase === 'answering_with_options') && currentQuestion && (
              <div className="space-y-4">
                <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <span className="text-white/70">Domain: </span>
                      <span className="text-white font-bold">{currentDomain?.name}</span>
                      <span className="text-white/70 ml-4">Question #{currentQuestion.number}</span>
                    </div>
                  </div>
                  <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-xl p-4 mb-4">
                    <div className="text-yellow-400 font-bold text-lg mb-2">Current Turn: {currentTeam?.name}</div>
                    <div className="text-white/70 text-sm">
                      {quiz.phase === 'answering_with_options' ? 'Answering with options shown' : 'Answering without options'}
                    </div>
                  </div>
                  <div className="bg-slate-900/30 rounded-xl p-6">
                    <div className="text-3xl text-white font-bold mb-6">{currentQuestion.text}</div>
                    {quiz.phase === 'answering_with_options' && currentQuestion.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, idx) => (
                          <div key={idx} className="bg-blue-500/30 border border-blue-400 rounded-lg p-4 text-white font-semibold">
                            {String.fromCharCode(65 + idx)}. {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Buzzer Round - Buzzing */}
            {quiz.round === 'buzzer' && quiz.phase === 'buzzing' && currentBuzzerQuestion && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
                <div className="bg-slate-900/30 rounded-xl p-6 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-white/60">Buzzer Question #{currentBuzzerQuestion.number}</div>
                    <div className="text-sm text-white/60">
                      {quiz.buzzerQuestions.filter((q: any) => !q.isAnswered).length} questions remaining
                    </div>
                  </div>
                  <div className="text-3xl text-white font-bold mb-4">{currentBuzzerQuestion.text}</div>
                </div>
                <div className="bg-orange-500/20 border-2 border-orange-400 rounded-xl p-6 text-center">
                  <div className="text-2xl text-white font-bold">Waiting for buzzes...</div>
                </div>
                {quiz.buzzSequence.length > 0 && (
                  <div className="bg-yellow-500/20 rounded-xl p-4 mt-4">
                    <div className="text-white font-semibold mb-2">Buzzed:</div>
                    <div className="flex gap-2 flex-wrap">
                      {quiz.buzzSequence.map((teamId, idx) => {
                        const team = quiz.teams.find(t => t.id === teamId);
                        return (
                          <div key={idx} className="bg-yellow-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                            {idx + 1}. {team?.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buzzer Round - Answering */}
            {quiz.round === 'buzzer' && quiz.phase === 'answering' && currentBuzzerQuestion && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
                <div className="bg-slate-900/30 rounded-xl p-6 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-white/60">Buzzer Question #{currentBuzzerQuestion.number}</div>
                    <div className="text-sm text-white/60">
                      {quiz.buzzerQuestions.filter((q: any) => !q.isAnswered).length} questions remaining
                    </div>
                  </div>
                  <div className="text-3xl text-white font-bold mb-4">{currentBuzzerQuestion.text}</div>
                </div>
                <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-xl p-4 mb-4">
                  <div className="text-yellow-400 font-bold text-2xl text-center mb-4">
                    Teams Answering
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center gap-3 flex-wrap">
                      {quiz.buzzSequence.map((teamId, idx) => {
                        const team = quiz.teams.find(t => t.id === teamId);
                        return (
                          <div 
                            key={idx} 
                            className="px-4 py-2 rounded-full font-bold text-lg bg-yellow-500 text-black animate-pulse"
                          >
                            {idx + 1}. {team?.name}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-white/60 text-sm mt-3">
                      20 seconds each
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buzzer Round - Showing Answer */}
            {quiz.round === 'buzzer' && quiz.phase === 'showing_answer' && currentBuzzerQuestion && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
                <div className="bg-slate-900/30 rounded-xl p-6 mb-4">
                  <div className="text-sm text-white/60 mb-2">Buzzer Question #{currentBuzzerQuestion.number}</div>
                  <div className="text-3xl text-white font-bold mb-4">{currentBuzzerQuestion.text}</div>
                  <div className="bg-green-500/30 border border-green-400 rounded-lg p-4 mt-4">
                    <div className="text-green-200 font-semibold mb-1">Correct Answer:</div>
                    <div className="text-white text-xl font-bold">{currentBuzzerQuestion.answer}</div>
                  </div>
                </div>
                {quiz.lastRoundResults && Object.keys(quiz.lastRoundResults).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-white font-semibold mb-2">Results:</div>
                    {Object.entries(quiz.lastRoundResults).map(([teamId, result]: [string, any]) => {
                      const team = quiz.teams.find(t => t.id === teamId);
                      return (
                        <div key={teamId} className={`p-3 rounded-lg ${
                          result.isCorrect ? 'bg-green-500/20 border border-green-400' : 'bg-red-500/20 border border-red-400'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="text-white font-semibold">{team?.name}</span>
                            <span className={`font-bold ${
                              result.isCorrect ? 'text-green-300' : 'text-red-300'
                            }`}>
                              {result.points > 0 ? '+' : ''}{result.points} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Awaiting Evaluation */}
            {quiz.round === 'domain' && quiz.phase === 'awaiting_evaluation' && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-12 border border-slate-700/50">
                <div className="text-center mb-6">
                  <div className="inline-block p-6 bg-purple-500/20 rounded-full mb-6">
                    <svg className="w-20 h-20 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-bold mb-4 text-white">⚖️ Host is Evaluating...</h2>
                  <p className="text-slate-400 text-xl">Please wait while the host reviews the answer</p>
                </div>

                {/* Show the question */}
                {currentQuestion && (
                  <div className="space-y-4 mt-8">
                    <div className="bg-slate-900/50 rounded-lg p-6">
                      <p className="text-sm text-slate-400 mb-3">Question:</p>
                      <p className="text-2xl font-semibold text-white">{currentQuestion.text}</p>
                    </div>

                    {/* Show options ONLY if they were viewed */}
                    {currentQuestion.optionsViewed && currentQuestion.options && currentQuestion.options.length > 0 && (
                      <div className="bg-slate-900/50 rounded-lg p-6">
                        <p className="text-sm text-slate-400 mb-4">Options:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {currentQuestion.options.map((opt: string, idx: number) => (
                            <div key={idx} className="p-4 bg-slate-800/50 rounded-lg text-left">
                              <span className="font-semibold text-blue-400">{String.fromCharCode(65 + idx)}.</span> {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Showing Result */}
            {quiz.round === 'domain' && quiz.phase === 'showing_result' && quiz.lastDomainAnswer && quiz.lastDomainAnswer.questionCompleted && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-12 border border-slate-700/50">
                <div className="space-y-8">
                  {/* Question */}
                  <div className="text-center">
                    <h2 className="text-4xl font-bold mb-6 text-white">Question</h2>
                    <div className="text-3xl text-white/90 bg-blue-500/20 border border-blue-500 rounded-xl p-8">
                      {quiz.lastDomainAnswer.questionText}
                    </div>
                  </div>

                  {/* Correct Answer */}
                  <div className="text-center">
                    <h3 className="text-3xl font-bold mb-4 text-green-400">Correct Answer</h3>
                    <div className="text-2xl text-green-300 bg-green-500/20 border border-green-500 rounded-xl p-6">
                      {quiz.lastDomainAnswer.correctAnswer}
                    </div>
                  </div>

                  {/* All Team Answers */}
                  {quiz.lastDomainAnswer.allAnswers && quiz.lastDomainAnswer.allAnswers.length > 0 && quiz.lastDomainAnswer.questionCompleted && (
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-6 text-white">Team Answers</h3>
                      <div className="space-y-3">
                        {quiz.lastDomainAnswer.allAnswers.map((teamAnswer: any) => (
                          <div 
                            key={teamAnswer.teamId}
                            className={`text-xl ${
                              teamAnswer.isPassed
                                ? 'text-red-300'
                                : teamAnswer.isCorrect 
                                  ? 'text-green-300' 
                                  : 'text-red-300'
                            }`}
                          >
                            <span className="font-bold">{teamAnswer.teamName}:</span>
                            {teamAnswer.isPassed ? (
                              <span className="ml-2">PASSED</span>
                            ) : teamAnswer.isTimeout ? (
                              <span className="ml-2 text-orange-400">TIMEOUT</span>
                            ) : teamAnswer.answer ? (
                              <span className="ml-2">"{teamAnswer.answer}"</span>
                            ) : (
                              <span className="ml-2">No answer</span>
                            )}
                            <span className="ml-3 text-lg opacity-75">
                              ({teamAnswer.points > 0 ? '+' : ''}{teamAnswer.points} pts)
                            </span>
                            {!teamAnswer.wasTabActive && (
                              <span className="ml-3 text-sm text-yellow-400">⚠ Tab inactive</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timer */}
                  {timeLeft !== null && timeLeft > 0 && (
                    <div className="text-center text-white/70 text-xl">
                      Next in {timeLeft}s...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Round Ended */}
            {quiz.phase === 'domain_round_ended' && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-12 text-center border border-slate-700/50">
                <div className="text-2xl text-white font-semibold">Domain Round Complete!</div>
              </div>
            )}

            {quiz.phase === 'completed' && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-12 text-center border border-slate-700/50">
                <div className="text-3xl text-white font-bold mb-4">Quiz Complete!</div>
                <div className="text-xl text-yellow-400">Winner: {sortedTeams[0]?.name}</div>
              </div>
            )}

            {quiz.status === 'setup' && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-12 text-center border border-slate-700/50">
                <div className="text-6xl mb-4"><Eye className="inline w-16 h-16" /></div>
                <div className="text-2xl text-white font-semibold">Waiting for quiz to start...</div>
              </div>
            )}
          </div>

          {/* Leaderboard Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700/50 sticky top-4">
              <h2 className="text-2xl font-bold text-white mb-4"><Trophy className="inline w-6 h-6 mr-2" />Leaderboard</h2>
              <div className="space-y-3">
                {sortedTeams.map((team, index) => (
                  <div
                    key={team.id}
                    className={`p-4 rounded-xl ${
                      team.id === quiz.currentTeamId
                        ? 'bg-yellow-500/30 border-2 border-yellow-400'
                        : 'bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-xl font-bold ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-slate-400' :
                        index === 2 ? 'text-orange-400' :
                        'text-white/50'
                      }`}>
                        <Award className="inline w-5 h-5 mr-1" />#{index + 1}
                      </div>
                      <div className="text-2xl font-bold text-white">{team.score}</div>
                    </div>
                    <div className="text-lg font-bold text-white">{team.name}</div>
                    {team.captainName && (
                      <div className="text-xs text-white/60">{team.captainName}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
