'use client';

import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { 
  createTeam, 
  createDomain, 
  createQuestion, 
  createBuzzerQuestion,
  deleteTeam, 
  deleteDomain, 
  deleteQuestion, 
  deleteBuzzerQuestion,
  updateTeam, 
  updateDomain, 
  updateQuestion, 
  updateBuzzerQuestion 
} from '@/lib/actions';

export default function SetupDashboard({ quiz }: { quiz: any }) {
  const { socket, isConnected, hasReconnected } = useSocket(quiz.id);
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [domainName, setDomainName] = useState('');
  const [questionData, setQuestionData] = useState({ 
    text: '', 
    answer: '', 
    options: ['', '', '', ''], 
    correctIndex: -1, 
    optionsDefault: false 
  });
  const [buzzerData, setBuzzerData] = useState({ 
    text: '', 
    answer: '', 
    options: ['', '', '', ''], 
    correctIndex: -1 
  });
  const [selectedDomain, setSelectedDomain] = useState('');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editingBuzzer, setEditingBuzzer] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTeam(quiz.id, teamName);
    setTeamName('');
    router.refresh();
  };

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDomain(quiz.id, domainName);
    setDomainName('');
    router.refresh();
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;
    const filteredOptions = questionData.options.filter(o => o.trim());
    const answer = questionData.correctIndex >= 0 ? questionData.options[questionData.correctIndex] : questionData.answer;
    await createQuestion(
      selectedDomain,
      questionData.text,
      answer,
      filteredOptions,
      questionData.optionsDefault
    );
    setQuestionData({ text: '', answer: '', options: ['', '', '', ''], correctIndex: -1, optionsDefault: false });
    router.refresh();
  };

  const handleCreateBuzzerQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredOptions = buzzerData.options.filter((o: string) => o.trim());
    const answer = buzzerData.correctIndex >= 0 ? buzzerData.options[buzzerData.correctIndex] : buzzerData.answer;
    await createBuzzerQuestion(quiz.id, buzzerData.text, answer, filteredOptions);
    setBuzzerData({ text: '', answer: '', options: ['', '', '', ''], correctIndex: -1 });
    router.refresh();
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">🎯 Setup Dashboard</h1>
            <a 
              href={`/quiz/${quiz.id}/host/control`}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
            >
              Go to Control Dashboard →
            </a>
          </div>
          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
            <p className="text-sm font-medium">Quiz ID:</p>
            <p className="text-2xl font-mono mt-2 break-all">{quiz.id}</p>
          </div>
        </div>

        {/* Teams Section */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">👥 Teams ({quiz.teams.length})</h2>
          <form onSubmit={handleCreateTeam} className="mb-4 flex gap-2">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Team name"
              required
            />
            <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold">
              <Plus className="w-5 h-5" />
            </button>
          </form>
          <div className="space-y-2">
            {quiz.teams.map((team: any) => (
              <div key={team.id} className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center">
                {editingTeam === team.id ? (
                  <input
                    type="text"
                    value={editValues[team.id] || team.name}
                    onChange={(e) => setEditValues({ ...editValues, [team.id]: e.target.value })}
                    className="flex-1 px-2 py-1 rounded bg-slate-900/50 border border-slate-700"
                    autoFocus
                  />
                ) : (
                  <div className="font-semibold">{team.name}</div>
                )}
                <div className="flex gap-2">
                  {editingTeam === team.id ? (
                    <>
                      <button
                        onClick={async () => {
                          await updateTeam(team.id, editValues[team.id]);
                          setEditingTeam(null);
                          router.refresh();
                        }}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingTeam(null)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingTeam(team.id);
                          setEditValues({ ...editValues, [team.id]: team.name });
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete ${team.name}?`)) {
                            await deleteTeam(team.id);
                            router.refresh();
                          }
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Domains Section */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">📚 Domains ({quiz.domains.length})</h2>
          <form onSubmit={handleCreateDomain} className="mb-4 flex gap-2">
            <input
              type="text"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Domain name"
              required
            />
            <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold">
              <Plus className="w-5 h-5" />
            </button>
          </form>
          <div className="space-y-4">
            {quiz.domains.map((domain: any) => (
              <div key={domain.id} className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  {editingDomain === domain.id ? (
                    <input
                      type="text"
                      value={editValues[domain.id] || domain.name}
                      onChange={(e) => setEditValues({ ...editValues, [domain.id]: e.target.value })}
                      className="flex-1 px-2 py-1 rounded bg-slate-900/50 border border-slate-700"
                      autoFocus
                    />
                  ) : (
                    <div className="font-semibold text-lg">{domain.name}</div>
                  )}
                  <div className="flex gap-2">
                    {editingDomain === domain.id ? (
                      <>
                        <button
                          onClick={async () => {
                            await updateDomain(domain.id, editValues[domain.id]);
                            setEditingDomain(null);
                            router.refresh();
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingDomain(null)}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingDomain(domain.id);
                            setEditValues({ ...editValues, [domain.id]: domain.name });
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete ${domain.name}?`)) {
                              await deleteDomain(domain.id);
                              router.refresh();
                            }
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Questions List */}
                {domain.questions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-slate-400">Questions: {domain.questions.length}</p>
                    {domain.questions.map((q: any) => (
                      <div key={q.id} className="bg-slate-900/50 rounded p-3">
                        {editingQuestion === q.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editValues[`${q.id}_text`] || q.text}
                              onChange={(e) => setEditValues({ ...editValues, [`${q.id}_text`]: e.target.value })}
                              className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700"
                              placeholder="Question text"
                            />
                            <div className="space-y-1">
                              {(editValues[`${q.id}_options`] || q.options || []).map((opt: string, i: number) => (
                                <div key={i} className="flex gap-2 items-center">
                                  <input
                                    type="radio"
                                    name={`correct_${q.id}`}
                                    checked={(editValues[`${q.id}_answer`] || q.answer) === opt}
                                    onChange={() => setEditValues({ ...editValues, [`${q.id}_answer`]: opt })}
                                    className="w-4 h-4"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...(editValues[`${q.id}_options`] || q.options || [])];
                                      newOpts[i] = e.target.value;
                                      setEditValues({ ...editValues, [`${q.id}_options`]: newOpts });
                                    }}
                                    className="flex-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-sm"
                                    placeholder={`Option ${i + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  await updateQuestion(
                                    q.id,
                                    editValues[`${q.id}_text`] || q.text,
                                    editValues[`${q.id}_answer`] || q.answer,
                                    editValues[`${q.id}_options`] || q.options || []
                                  );
                                  setEditingQuestion(null);
                                  router.refresh();
                                }}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingQuestion(null)}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <span className="text-xs text-slate-500">Q{q.number}</span>
                                {q.optionsDefault && (
                                  <span className="ml-2 px-2 py-1 bg-blue-500/30 text-blue-300 rounded text-xs">MC</span>
                                )}
                                <p className="text-sm mt-1">{q.text}</p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingQuestion(q.id);
                                    setEditValues({
                                      ...editValues,
                                      [`${q.id}_text`]: q.text,
                                      [`${q.id}_answer`]: q.answer,
                                      [`${q.id}_options`]: q.options || []
                                    });
                                  }}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Delete this question?')) {
                                      await deleteQuestion(q.id);
                                      router.refresh();
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            {q.options && q.options.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {q.options.map((opt: string, i: number) => (
                                  <div key={i} className="text-xs flex items-center gap-2">
                                    <span className={opt === q.answer ? 'text-green-400 font-semibold' : 'text-slate-400'}>
                                      {String.fromCharCode(65 + i)}. {opt}
                                      {opt === q.answer && ' ✓'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Question Form */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">➕ Add Domain Question</h2>
          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            >
              <option value="">Select Domain</option>
              {quiz.domains.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <input
              type="text"
              value={questionData.text}
              onChange={(e) => setQuestionData({ ...questionData, text: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Question text"
              required
            />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Options (select correct answer):</p>
              {questionData.options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={questionData.correctIndex === i}
                    onChange={() => setQuestionData({ ...questionData, correctIndex: i })}
                    className="w-5 h-5"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...questionData.options];
                      newOpts[i] = e.target.value;
                      setQuestionData({ ...questionData, options: newOpts });
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder={`Option ${i + 1}`}
                    required
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <input
                type="checkbox"
                id="optionsDefault"
                checked={questionData.optionsDefault}
                onChange={(e) => setQuestionData({ ...questionData, optionsDefault: e.target.checked })}
                className="w-5 h-5 text-blue-600"
              />
              <label htmlFor="optionsDefault" className="text-sm font-medium">
                <span className="text-blue-300">Options enabled by default</span>
                <div className="text-xs text-slate-400 mt-1">
                  Multiple choice question: Shows options automatically, cannot be passed, +10 correct / -5 incorrect
                </div>
              </label>
            </div>
            
            <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold">
              Add Question
            </button>
          </form>
        </div>

        {/* Buzzer Questions Section */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">⚡ Buzzer Questions</h2>
          
          {/* Buzzer Questions List */}
          {quiz.buzzerQuestions && quiz.buzzerQuestions.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-sm text-slate-400">Total: {quiz.buzzerQuestions.length}</p>
              {quiz.buzzerQuestions.map((q: any) => (
                <div key={q.id} className="bg-slate-900/50 rounded p-3">
                  {editingBuzzer === q.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editValues[`${q.id}_text`] || q.text}
                        onChange={(e) => setEditValues({ ...editValues, [`${q.id}_text`]: e.target.value })}
                        className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700"
                        placeholder="Question text"
                      />
                      <input
                        type="text"
                        value={editValues[`${q.id}_answer`] || q.answer}
                        onChange={(e) => setEditValues({ ...editValues, [`${q.id}_answer`]: e.target.value })}
                        className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700"
                        placeholder="Answer"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await updateBuzzerQuestion(
                              q.id,
                              editValues[`${q.id}_text`] || q.text,
                              editValues[`${q.id}_answer`] || q.answer,
                              []
                            );
                            setEditingBuzzer(null);
                            router.refresh();
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingBuzzer(null)}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="text-xs text-slate-500">Q{q.number}</span>
                        <p className="text-sm mt-1">{q.text}</p>
                        <p className="text-xs text-green-400 mt-1">Answer: {q.answer}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingBuzzer(q.id);
                            setEditValues({
                              ...editValues,
                              [`${q.id}_text`]: q.text,
                              [`${q.id}_answer`]: q.answer
                            });
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this buzzer question?')) {
                              await deleteBuzzerQuestion(q.id);
                              router.refresh();
                            }
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Buzzer Question Form */}
          <form onSubmit={handleCreateBuzzerQuestion} className="space-y-4">
            <input
              type="text"
              value={buzzerData.text}
              onChange={(e) => setBuzzerData({ ...buzzerData, text: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Question text"
              required
            />
            <input
              type="text"
              value={buzzerData.answer}
              onChange={(e) => setBuzzerData({ ...buzzerData, answer: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Answer"
              required
            />
            <button type="submit" className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold">
              Add Buzzer Question
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
