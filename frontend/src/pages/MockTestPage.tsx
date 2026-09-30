import React, { useEffect, useState } from 'react';
import { examService } from '../services/api';
import { ExamSession, ExamQuestionItem } from '../types';
import { StrictEditor } from '../components/StrictEditor';
import { Console } from '../components/Console';
import { ExamTimer } from '../components/ExamTimer';
import { Play, Send, CheckCircle2, AlertCircle, HelpCircle, ShieldAlert, Award } from 'lucide-react';

export const MockTestPage: React.FC = () => {
  const [exam, setExam] = useState<ExamSession | null>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Active Question state
  const [code, setCode] = useState<string>('');
  const [status, setStatus] = useState<'not_attempted' | 'submitted' | 'review'>('not_attempted');
  
  // Custom execution state
  const [customInput, setCustomInput] = useState<string>('');
  const [customOutput, setCustomOutput] = useState<string>('');
  const [compilerOutput, setCompilerOutput] = useState<string>('');
  const [customStatus, setCustomStatus] = useState<string>('');
  const [customExecutionTime, setCustomExecutionTime] = useState<number>(0);
  const [customMemoryUsed, setCustomMemoryUsed] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Result state
  const [finalResult, setFinalResult] = useState<any>(null);

  const initExam = async () => {
    setLoading(true);
    try {
      let active = await examService.getActiveExam();
      if (!active) {
        active = await examService.startExam({
          duration_minutes: 90,
          total_questions: 6,
          language: 'cpp',
          mode: 'strict'
        });
      }
      setExam(active);
      if (active.questions.length > 0) {
        setActiveIdx(0);
        setCode(active.questions[0].user_code || '');
        setStatus(active.questions[0].status as any);
      }
    } catch (err) {
      console.error("Failed to start/fetch exam", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initExam();
  }, []);

  const currentQ: ExamQuestionItem | null = exam?.questions[activeIdx] || null;

  const handleQuestionSelect = async (idx: number) => {
    if (!exam || !currentQ) return;
    // Save current question progress
    await examService.saveProgress(exam.id, currentQ.id, code, currentQ.language, status);
    
    // Switch question
    setActiveIdx(idx);
    const targetQ = exam.questions[idx];
    setCode(targetQ.user_code || '');
    setStatus(targetQ.status as any);
  };

  const handleSaveAndNext = async () => {
    if (!exam || !currentQ) return;
    await examService.saveProgress(exam.id, currentQ.id, code, currentQ.language, 'submitted');
    
    // Update local exam state
    const updated = { ...exam };
    updated.questions[activeIdx].status = 'submitted';
    updated.questions[activeIdx].user_code = code;
    setExam(updated);

    if (activeIdx < exam.questions.length - 1) {
      handleQuestionSelect(activeIdx + 1);
    }
  };

  const handleMarkForReview = async () => {
    if (!exam || !currentQ) return;
    const newStatus = status === 'review' ? 'not_attempted' : 'review';
    setStatus(newStatus);
    await examService.saveProgress(exam.id, currentQ.id, code, currentQ.language, newStatus);
    
    const updated = { ...exam };
    updated.questions[activeIdx].status = newStatus;
    setExam(updated);
  };

  const handleFinalSubmit = async () => {
    if (!exam) return;
    if (!window.confirm("Are you sure you want to submit your TCS Mock Assessment? All completed solutions will be evaluated against hidden tests.")) {
      return;
    }
    setIsExecuting(true);
    try {
      // Save active progress first
      if (currentQ) {
        await examService.saveProgress(exam.id, currentQ.id, code, currentQ.language, status);
      }
      const res = await examService.finalizeExam(exam.id);
      setFinalResult(res);
    } catch (err) {
      console.error("Failed to finalize exam", err);
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
        Initializing Server-Authoritative TCS Exam Session...
      </div>
    );
  }

  if (finalResult) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/40">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              TCS MOCK ASSESSMENT REPORT
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Official Assessment Result Card & Topic Breakdown
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto font-mono text-center">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Score</span>
              <span className="text-2xl font-bold text-blue-400">{finalResult.solved_count} / {finalResult.total_questions}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Total Attempts</span>
              <span className="text-2xl font-bold text-slate-200">{finalResult.total_attempts}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Time Used</span>
              <span className="text-2xl font-bold text-amber-400">{Math.floor(finalResult.time_used_seconds / 60)}m {finalResult.time_used_seconds % 60}s</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Accuracy</span>
              <span className="text-2xl font-bold text-emerald-400">
                {Math.round((finalResult.solved_count / finalResult.total_questions) * 100)}%
              </span>
            </div>
          </div>

          {/* Question breakdown list */}
          <div className="space-y-3 text-left">
            <h3 className="text-sm font-bold text-slate-300 font-mono uppercase">
              Question Results Breakdown:
            </h3>
            <div className="space-y-2">
              {finalResult.questions_result.map((qr: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-slate-200 block">
                      Q{idx + 1}. {qr.title}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Category: {qr.category} ({qr.difficulty})
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                        qr.verdict === 'ACCEPTED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {qr.verdict}
                    </span>
                    <span className="block text-[11px] text-slate-500 font-mono mt-1">
                      Tests: {qr.passed_tests} / {qr.total_tests}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => window.location.href = "/"}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!exam || !currentQ) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar: TCS Exam Header + Navigator + Timer */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span className="font-extrabold text-base tracking-tight text-white">
              TCS MOCK ASSESSMENT
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-red-950 text-red-400 border border-red-800">
            STRICT MODE LOCKED
          </span>
        </div>

        {/* Question Navigator Grid */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-mono mr-1">Navigator:</span>
          {exam.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => handleQuestionSelect(idx)}
              className={`w-8 h-8 rounded font-mono text-xs font-bold transition-all relative flex items-center justify-center ${
                activeIdx === idx
                  ? 'ring-2 ring-blue-500 bg-blue-600 text-white shadow-lg'
                  : q.status === 'submitted'
                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                  : q.status === 'review'
                  ? 'bg-amber-950 border border-amber-800 text-amber-400'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {idx + 1}
              {q.status === 'submitted' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />}
              {q.status === 'review' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Server Timer & Final Submit Button */}
        <div className="flex items-center space-x-4">
          <ExamTimer initialSeconds={exam.remaining_seconds} onTimeUp={handleFinalSubmit} />
          <button
            onClick={handleFinalSubmit}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-900/40 transition-colors"
          >
            End & Finalize Exam
          </button>
        </div>
      </div>

      {/* Assessment Split Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 overflow-hidden">
        {/* Left: Problem Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 overflow-y-auto space-y-6 text-sm">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <span className="text-xs text-blue-400 font-mono font-bold uppercase">
              Question {activeIdx + 1} of {exam.total_questions}
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {currentQ.question.title}
            </h1>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              Category & Difficulty
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 font-semibold">
                {currentQ.question.category}
              </span>
              <span className="px-2.5 py-1 bg-blue-950 border border-blue-800 rounded text-xs text-blue-400 font-mono">
                {currentQ.question.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Bottom Controls */}
        <div className="flex flex-col space-y-3 h-full overflow-hidden">
          <div className="flex-1 min-h-[300px]">
            <StrictEditor
              value={code}
              onChange={(val) => setCode(val)}
              language={currentQ.language}
              mode="strict"
              isModeLocked={true}
            />
          </div>

          {/* Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
            <button
              onClick={handleMarkForReview}
              className={`px-3 py-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                status === 'review'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              {status === 'review' ? 'Marked for Review' : 'Mark for Review'}
            </button>

            <button
              onClick={handleSaveAndNext}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded shadow-lg transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Save & Next Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
