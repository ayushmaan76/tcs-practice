import React, { useEffect, useState } from 'react';
import { questionService } from '../services/api';
import { QuestionSummary } from '../types';
import { QuestionList } from '../components/QuestionList';
import { Search, Filter, ArrowUpDown, Bookmark, RefreshCw } from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await questionService.getQuestions({
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        difficulty: difficulty !== 'All' ? difficulty : undefined,
        status: status !== 'All' ? status : undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setQuestions(data);
    } catch (err) {
      console.error("Failed to fetch questions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const cats = await questionService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [search, category, difficulty, status, sortBy, sortOrder]);

  const handleToggleBookmark = async (id: number) => {
    try {
      await questionService.toggleBookmark(id);
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, is_bookmarked: !q.is_bookmarked } : q))
      );
    } catch (err) {
      console.error("Failed to bookmark question", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            TCS Coding Question Bank
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Categorized TCS assessment problem set. Practice in Strict Raw Editor mode.
          </p>
        </div>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by title, topic, tag, difficulty, concept, or question number (e.g. 'prime', 'arrays', '31')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-sans"
          />
        </div>

        {/* Multi-facet Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Solved">Solved ✓</option>
              <option value="Unsolved">Unsolved</option>
              <option value="Attempted">Attempted</option>
              <option value="Not Attempted">Not Attempted</option>
              <option value="Bookmarked">Bookmarked ★</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="id">Question Number</option>
              <option value="difficulty">Difficulty</option>
              <option value="estimated_time">Estimated Time</option>
              <option value="recently_added">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
        <span>Showing {questions.length} questions</span>
        {(search || category !== 'All' || difficulty !== 'All' || status !== 'All') && (
          <button
            onClick={() => {
              setSearch('');
              setCategory('All');
              setDifficulty('All');
              setStatus('All');
            }}
            className="text-blue-400 hover:underline flex items-center gap-1 font-sans"
          >
            <RefreshCw className="w-3 h-3" /> Clear Filters
          </button>
        )}
      </div>

      {/* Question Table */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 font-mono text-xs">
          Loading matching questions...
        </div>
      ) : (
        <QuestionList questions={questions} onToggleBookmark={handleToggleBookmark} />
      )}
    </div>
  );
};
