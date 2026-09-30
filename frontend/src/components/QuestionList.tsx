import React from 'react';
import { Link } from 'react-router-dom';
import { QuestionSummary } from '../types';
import { CheckCircle2, Clock, Star, Circle, AlertCircle } from 'lucide-react';

interface QuestionListProps {
  questions: QuestionSummary[];
  onToggleBookmark: (id: number) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({ questions, onToggleBookmark }) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">Easy</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">Medium</span>;
      case 'Hard':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800/60">Hard</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">{diff}</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'solved':
        return (
          <span className="flex items-center text-xs text-emerald-400 font-semibold gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Solved
          </span>
        );
      case 'attempted':
        return (
          <span className="flex items-center text-xs text-amber-400 font-semibold gap-1">
            <AlertCircle className="w-4 h-4 text-amber-400" /> Attempted
          </span>
        );
      default:
        return (
          <span className="flex items-center text-xs text-slate-500 gap-1 font-mono">
            <Circle className="w-3.5 h-3.5" /> -
          </span>
        );
    }
  };

  if (questions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        <p className="text-base font-medium">No questions matched your search criteria.</p>
        <p className="text-xs text-slate-500 mt-1">Try clearing filters or adjusting your search term.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12 text-center">#</th>
              <th className="py-3.5 px-4">Problem Statement</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Difficulty</th>
              <th className="py-3.5 px-4 text-center">Est. Time</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 w-12 text-center">Bookmark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {questions.map((q) => (
              <tr key={q.id} className="hover:bg-slate-800/50 transition-colors group">
                <td className="py-3.5 px-4 font-mono text-xs text-slate-500 text-center font-bold">
                  {q.id}
                </td>
                <td className="py-3.5 px-4 font-medium">
                  <Link
                    to={`/questions/${q.id}`}
                    className="text-slate-100 group-hover:text-blue-400 transition-colors font-semibold"
                  >
                    {q.title}
                  </Link>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {q.tags.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-300 text-xs font-medium">
                  {q.category}
                </td>
                <td className="py-3.5 px-4">
                  {getDifficultyBadge(q.difficulty)}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {q.estimated_time}m
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {getStatusIcon(q.status)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => onToggleBookmark(q.id)}
                    className="text-slate-500 hover:text-amber-400 transition-colors p-1"
                    title={q.is_bookmarked ? "Remove bookmark" : "Bookmark question"}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        q.is_bookmarked ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
