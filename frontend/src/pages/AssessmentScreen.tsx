import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionService, submissionService } from '../services/api';
import { QuestionDetail, Submission } from '../types';
import { StrictEditor } from '../components/StrictEditor';
import { Console } from '../components/Console';
import { EditorMode } from '../utils/editorConfig';
import { ArrowLeft, Star, ShieldAlert, Sparkles, BookOpen, Clock, Cpu, CheckCircle2 } from 'lucide-react';

export const AssessmentScreen: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Language & Code State
  const [language, setLanguage] = useState<string>('cpp');
  const [code, setCode] = useState<string>('');
  const [editorMode, setEditorMode] = useState<EditorMode>('strict');

  // Console & Execution State
  const [customInput, setCustomInput] = useState<string>('');
  const [customOutput, setCustomOutput] = useState<string>('');
  const [compilerOutput, setCompilerOutput] = useState<string>('');
  const [customStatus, setCustomStatus] = useState<string>('');
  const [customExecutionTime, setCustomExecutionTime] = useState<number>(0);
  const [customMemoryUsed, setCustomMemoryUsed] = useState<number>(0);

  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const q = await questionService.getQuestionDetail(idOrSlug);
        setQuestion(q);
        if (q.test_cases && q.test_cases.length > 0) {
          setCustomInput(q.test_cases[0].input_data || '');
        }
        // Set default starter code
        if (q.solutions && q.solutions['cpp']) {
          setCode(q.solutions['cpp']);
        } else {
          setCode(`#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`);
        }
      } catch (err) {
        console.error("Failed to load question details", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [idOrSlug]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (question && question.solutions && question.solutions[newLang]) {
      setCode(question.solutions[newLang]);
    } else {
      if (newLang === 'java') {
        setCode(`import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write code here\n    }\n}\n`);
      } else if (newLang === 'python') {
        setCode(`import sys\n\ndef main():\n    # Write code here\n    pass\n\nif __name__ == '__main__':\n    main()\n`);
      } else {
        setCode(`#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write solution\n    return 0;\n}\n`);
      }
    }
  };

  const handleRunCustom = async () => {
    if (!question) return;
    setIsExecuting(true);
    try {
      const res = await submissionService.runCustomInput({
        question_id: question.id,
        language,
        source_code: code,
        custom_input: customInput
      });
      setCustomOutput(res.output || '');
      setCompilerOutput(res.compiler_output || '');
      setCustomStatus(res.status);
      setCustomExecutionTime(res.execution_time);
      setCustomMemoryUsed(res.memory_used);
    } catch (err: any) {
      setCompilerOutput(err.message || 'Execution error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (!question) return;
    setIsExecuting(true);
    try {
      const res = await submissionService.submitSolution({
        question_id: question.id,
        language,
        source_code: code,
        mode: editorMode
      });
      setSubmissionResult(res);
    } catch (err: any) {
      console.error("Submission failed", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    handleLanguageChange(language);
    setSubmissionResult(null);
    setCompilerOutput('');
    setCustomOutput('');
  };

  const handleToggleBookmark = async () => {
    if (!question) return;
    try {
      const res = await questionService.toggleBookmark(question.id);
      setQuestion({ ...question, is_bookmarked: res.bookmarked });
    } catch (err) {
      console.error("Bookmark toggle failed", err);
    }
  };

  if (loading || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
        Loading TCS Assessment Environment...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Assessment Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link
            to="/questions"
            className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Question Bank
          </Link>
          <div className="h-4 w-px bg-slate-800"></div>
          <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Question {question.id}</span>
            <span className="text-slate-500 font-normal">/</span>
            <span className="text-slate-300 font-semibold">{question.title}</span>
          </h2>
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-950 text-blue-400 border border-blue-800">
            {question.category}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded">
            <span className="text-slate-400 font-sans">Language:</span>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-transparent text-blue-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value="cpp" className="bg-slate-900">C++ (g++ 17)</option>
              <option value="java" className="bg-slate-900">Java (OpenJDK 17)</option>
              <option value="python" className="bg-slate-900">Python (python3)</option>
            </select>
          </div>

          <button
            onClick={handleToggleBookmark}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title="Bookmark Question"
          >
            <Star
              className={`w-4 h-4 ${
                question.is_bookmarked ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Split Body: Left Problem Description, Right Strict Editor */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 overflow-hidden">
        {/* Left Column: Problem Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 overflow-y-auto space-y-6 text-sm">
          {/* Header info */}
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                {question.title}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  question.difficulty === 'Easy'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : question.difficulty === 'Medium'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-red-950 text-red-400 border border-red-800'
                }`}
              >
                {question.difficulty}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Time Limit: {question.time_limit} sec
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> Memory Limit: {question.memory_limit} MB
              </span>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              Problem Statement
            </h3>
            <p className="text-slate-200 leading-relaxed font-sans whitespace-pre-line">
              {question.description}
            </p>
          </div>

          {/* Input Format */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              Input Format
            </h3>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-slate-300">
              {question.input_format}
            </div>
          </div>

          {/* Output Format */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              Output Format
            </h3>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-slate-300">
              {question.output_format}
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              Constraints
            </h3>
            <ul className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-amber-300/90 list-disc list-inside space-y-1">
              {question.constraints.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>

          {/* Sample Examples */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              Sample Examples
            </h3>
            {question.examples.map((ex, idx) => (
              <div key={idx} className="bg-slate-950 rounded border border-slate-800 overflow-hidden text-xs">
                <div className="bg-slate-800/60 px-3 py-1.5 font-mono font-bold text-slate-300 border-b border-slate-800">
                  Example {idx + 1}
                </div>
                <div className="p-3 space-y-3 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Input:</span>
                    <pre className="bg-slate-900 p-2 rounded text-slate-200">{ex.input}</pre>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Output:</span>
                    <pre className="bg-slate-900 p-2 rounded text-emerald-400">{ex.output}</pre>
                  </div>
                  {ex.explanation && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block mb-1">Explanation:</span>
                      <p className="font-sans text-slate-400">{ex.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Learning Mode Explanations */}
          {editorMode === 'learning' && question.explanation && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-lg space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Explanation & Algorithm Guidance
              </h4>
              <p className="text-xs text-emerald-200/90 leading-relaxed font-sans">
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Bottom Console Split */}
        <div className="flex flex-col space-y-3 h-full overflow-hidden">
          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[320px]">
            <StrictEditor
              value={code}
              onChange={(val) => setCode(val)}
              language={language}
              mode={editorMode}
              onModeChange={(m) => setEditorMode(m)}
            />
          </div>

          {/* Console Section */}
          <div className="h-[220px] flex-shrink-0">
            <Console
              customInput={customInput}
              setCustomInput={setCustomInput}
              customOutput={customOutput}
              compilerOutput={compilerOutput}
              customStatus={customStatus}
              customExecutionTime={customExecutionTime}
              customMemoryUsed={customMemoryUsed}
              onRunCustom={handleRunCustom}
              onSubmit={handleSubmit}
              onReset={handleReset}
              isExecuting={isExecuting}
              submissionResult={submissionResult}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
