import React, { useState } from 'react';
import { Play, Send, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Clock, Cpu } from 'lucide-react';
import { Submission } from '../types';

interface ConsoleProps {
  customInput: string;
  setCustomInput: (val: string) => void;
  customOutput: string;
  compilerOutput: string;
  customStatus: string;
  customExecutionTime: number;
  customMemoryUsed: number;
  onRunCustom: () => void;
  onSubmit: () => void;
  onReset: () => void;
  isExecuting: boolean;
  submissionResult?: Submission | null;
}

export const Console: React.FC<ConsoleProps> = ({
  customInput,
  setCustomInput,
  customOutput,
  compilerOutput,
  customStatus,
  customExecutionTime,
  customMemoryUsed,
  onRunCustom,
  onSubmit,
  onReset,
  isExecuting,
  submissionResult
}) => {
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'errors' | 'results'>(
    submissionResult ? 'results' : 'input'
  );

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden h-full shadow-lg">
      {/* Console Tab Header */}
      <div className="flex items-center justify-between px-4 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'input'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            CUSTOM INPUT
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'output'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            PROGRAM OUTPUT {customStatus && customStatus !== 'OK' && `(${customStatus})`}
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'errors'
                ? 'border-red-500 text-red-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            COMPILER / ERRORS {compilerOutput && '(!)'}
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'results'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            TEST RESULTS {submissionResult && `(${submissionResult.verdict})`}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 py-1.5">
          <button
            onClick={onReset}
            disabled={isExecuting}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={onRunCustom}
            disabled={isExecuting}
            className="flex items-center space-x-1 px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 shadow"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Running...' : 'Run Custom'}</span>
          </button>
          <button
            onClick={onSubmit}
            disabled={isExecuting}
            className="flex items-center space-x-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-lg shadow-emerald-900/30 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isExecuting ? 'Judging...' : 'Submit Code'}</span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 p-3 bg-slate-950/80 font-mono text-xs overflow-y-auto min-h-[140px]">
        {activeTab === 'input' && (
          <div className="flex flex-col h-full space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Enter custom input parameters below:</span>
              <span className="text-amber-400/90 text-[10px]">
                * Custom runs do not count toward official test results.
              </span>
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. 5&#10;10 20 30 40 50"
              className="flex-1 w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono resize-none"
              rows={4}
            />
          </div>
        )}

        {activeTab === 'output' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
              <span>Program Standard Output:</span>
              <div className="flex space-x-3 text-slate-400 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  {customExecutionTime}s
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  {customMemoryUsed} MB
                </span>
              </div>
            </div>
            <pre className="text-slate-200 whitespace-pre-wrap font-mono text-xs bg-slate-900 p-3 rounded border border-slate-800 min-h-[80px]">
              {customOutput || 'No output recorded yet. Click "Run Custom" to execute.'}
            </pre>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 block border-b border-slate-800 pb-1">
              Compiler & Standard Error Messages:
            </span>
            {compilerOutput ? (
              <pre className="text-red-400 whitespace-pre-wrap font-mono text-xs bg-red-950/40 p-3 rounded border border-red-900/60">
                {compilerOutput}
              </pre>
            ) : (
              <div className="text-slate-500 italic p-3 text-center">
                No compilation errors or warnings reported.
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            {submissionResult ? (
              <div className="space-y-4">
                {/* Verdict Banner */}
                <div
                  className={`p-4 rounded-lg border flex items-center justify-between ${
                    submissionResult.verdict === 'ACCEPTED'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/60 border-red-800 text-red-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {submissionResult.verdict === 'ACCEPTED' ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-400" />
                    )}
                    <div>
                      <h4 className="text-base font-bold tracking-wide uppercase font-mono">
                        {submissionResult.verdict}
                      </h4>
                      <p className="text-xs opacity-90 font-mono">
                        Tests Passed: {submissionResult.passed_tests} / {submissionResult.total_tests}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4 font-mono text-xs text-right">
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400">Time</span>
                      <span className="font-semibold text-slate-200">{submissionResult.execution_time} sec</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400">Memory</span>
                      <span className="font-semibold text-slate-200">{submissionResult.memory_used} MB</span>
                    </div>
                  </div>
                </div>

                {/* Categorized Test Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block mb-1 font-sans">
                      Public Test Cases
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {submissionResult.public_passed} / {submissionResult.public_total}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block mb-1 font-sans">
                      Hidden Test Cases
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {submissionResult.hidden_passed} / {submissionResult.hidden_total}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block mb-1 font-sans">
                      Edge Test Cases
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {submissionResult.edge_passed} / {submissionResult.edge_total}
                    </span>
                  </div>
                </div>

                {submissionResult.compiler_output && (
                  <div className="mt-2">
                    <span className="text-xs text-red-400 font-semibold block mb-1">
                      Compiler Output:
                    </span>
                    <pre className="text-red-300 bg-red-950/50 p-2.5 rounded border border-red-900/60 font-mono text-xs">
                      {submissionResult.compiler_output}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 italic p-6 text-center font-sans">
                Click "Submit Code" to run your solution against the full official test suite.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
