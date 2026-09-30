import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  LayoutDashboard,
  BookOpenCheck,
  Timer,
  BarChart3,
  ShieldCheck,
  User as UserIcon,
  LogOut
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
            TCS
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block">
              PREP ENVIRONMENT
            </span>
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block -mt-1">
              Strict Assessment Platform
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-1">
          <Link
            to="/"
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/')
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/questions"
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/questions')
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpenCheck className="w-4 h-4" />
            <span>Question Bank</span>
          </Link>

          <Link
            to="/mock-test"
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/mock-test')
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Timer className="w-4 h-4 text-emerald-400" />
            <span>Mock Test</span>
          </Link>

          <Link
            to="/analytics"
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/analytics')
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin')
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-400 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Right Section: Streak & User Profile */}
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-950/50 border border-amber-700/50 rounded-full text-amber-400 font-mono text-xs shadow-sm">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="font-bold">{user.streak_count}</span>
              <span>day streak</span>
            </div>
          )}

          <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-left hidden md:block">
                <span className="block text-xs font-semibold text-slate-200">
                  {user?.username || 'Candidate'}
                </span>
                <span className="block text-[10px] text-slate-400 capitalize">
                  {user?.role || 'Candidate'}
                </span>
              </div>
            </div>

            {user && (
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
