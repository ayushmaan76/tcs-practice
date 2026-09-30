import React, { useEffect, useState } from 'react';
import { analyticsService, submissionService } from '../services/api';
import { TopicAnalytics, WeaknessReport, Submission } from '../types';
import { BarChart3, AlertTriangle, Code2, Clock, Cpu, CheckCircle2, XCircle } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [topics, setTopics] = useState<TopicAnalytics[]>([]);
  const [weakness, setWeakness] = useState<WeaknessReport | null>(null);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, wRes] = await Promise.all([
          analyticsService.getTopicAnalytics(),
          analyticsService.getWeaknessReport()
        ]);
        setTopics(tRes);
        setWeakness(wRes);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
        Generating Candidate Analytics & Weakness Report...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Performance Analytics & Weakness Report
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Detailed metrics computed strictly from your actual assessment submission history.
        </p>
      </div>

      {/* Weakness Engine Summary */}
      {weakness && (
        <div className="bg-amber-950/40 border border-amber-800/60 p-6 rounded-xl space-y-3 shadow-xl">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-amber-300">
                Weak Topic Analyzer
              </h3>
              <p className="text-sm text-amber-200/90 leading-relaxed mt-1">
                {weakness.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Performance Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          Category Accuracy Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map((t) => (
            <div key={t.category} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-200">{t.category}</span>
                <span className="font-mono text-xs font-bold text-blue-400">
                  {t.percentage}%
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${t.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
                <span>Solved: {t.solved_questions}</span>
                <span>Total Problems: {t.total_questions}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Version History Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Submission Code Viewer (ID: #{selectedSub.id})
                </h3>
                <span className="text-xs text-slate-400">
                  Submitted at: {new Date(selectedSub.submitted_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs font-mono bg-slate-950 p-3 rounded border border-slate-800">
                <span>Verdict: <strong className="text-emerald-400">{selectedSub.verdict}</strong></span>
                <span>Lang: <strong className="text-blue-400 uppercase">{selectedSub.language}</strong></span>
                <span>Time: {selectedSub.execution_time}s</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1 font-mono uppercase">Submitted Source Code:</span>
                <pre className="bg-slate-950 p-4 rounded border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap">
                  {selectedSub.source_code}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
