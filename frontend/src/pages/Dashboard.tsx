import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../services/api';
import { DashboardStats, TopicAnalytics, WeaknessReport } from '../types';
import {
  Flame,
  Target,
  Trophy,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
  Timer,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topics, setTopics] = useState<TopicAnalytics[]>([]);
  const [weakness, setWeakness] = useState<WeaknessReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashRes, topicRes, weakRes] = await Promise.all([
          analyticsService.getDashboardStats(),
          analyticsService.getTopicAnalytics(),
          analyticsService.getWeaknessReport()
        ]);
        setStats(dashRes);
        setTopics(topicRes);
        setWeakness(weakRes);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-sm">
        Loading TCS Practice Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 border border-blue-800/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950 text-blue-400 border border-blue-800 rounded-full text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> TCS NQT Practice Simulator
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, Candidate
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Strict raw editing mode, actual judge compilation, hidden test cases, and timed assessment simulations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/questions"
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 text-sm transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Continue Practice</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/mock-test"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 text-sm transition-all"
            >
              <Timer className="w-4 h-4" />
              <span>Start TCS Mock Test</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Questions Solved</span>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats?.questions_solved}
            <span className="text-xs text-slate-500 font-sans font-normal ml-2">
              / {stats?.questions_attempted} attempted
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Accuracy Rate</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            {stats?.accuracy_rate}%
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Daily Goal</span>
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats?.daily_progress}
            <span className="text-xs text-slate-500 font-sans font-normal ml-1">
              / {stats?.daily_goal} questions today
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Current Streak</span>
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">
            {stats?.current_streak}
            <span className="text-xs text-slate-500 font-sans font-normal ml-1">days consecutive</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Weakness Callout & Topic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Weakness Alert & Recommended Questions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weakness Engine Card */}
          {weakness && (
            <div className="bg-amber-950/40 border border-amber-800/60 p-6 rounded-xl space-y-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-amber-300">
                    Weakness Analysis Engine
                  </h3>
                  <p className="text-xs text-amber-200/90 mt-1">
                    {weakness.message}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-800/40 flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400">
                  Targeted Practice Category: {weakness.weak_topics.join(', ')}
                </span>
                <Link
                  to="/questions"
                  className="text-xs font-bold text-amber-300 hover:underline flex items-center gap-1"
                >
                  View Topic Problems <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Recommended Questions List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Recommended Questions
              </h3>
              <Link to="/questions" className="text-xs text-blue-400 hover:underline">
                View All Question Bank &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.recommended_questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <Link
                      to={`/questions/${q.id}`}
                      className="font-semibold text-sm text-slate-100 hover:text-blue-400 transition-colors"
                    >
                      #{q.id}. {q.title}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{q.category}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">{q.estimated_time} mins</span>
                    </div>
                  </div>

                  <Link
                    to={`/questions/${q.id}`}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/40 rounded text-xs font-semibold transition-all"
                  >
                    Solve Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Topic Performance Overview */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Topic Performance
            </h3>

            <div className="space-y-4">
              {topics.slice(0, 8).map((t) => (
                <div key={t.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300 truncate max-w-[180px]">
                      {t.category}
                    </span>
                    <span className="font-mono font-bold text-slate-400">
                      {t.percentage}% ({t.solved_questions}/{t.total_questions})
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${t.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/analytics"
              className="block text-center text-xs text-blue-400 font-semibold hover:underline pt-2"
            >
              View Detailed Topic Analytics &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
