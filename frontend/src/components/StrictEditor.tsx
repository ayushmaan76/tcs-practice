import React from 'react';
import Editor from '@monaco-editor/react';
import { getMonacoOptions, EditorMode } from '../utils/editorConfig';
import { ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface StrictEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: string;
  mode?: EditorMode;
  onModeChange?: (newMode: EditorMode) => void;
  isModeLocked?: boolean;
}

export const StrictEditor: React.FC<StrictEditorProps> = ({
  value,
  onChange,
  language,
  mode = 'strict',
  onModeChange,
  isModeLocked = false
}) => {
  // Map internal language codes to Monaco language IDs
  const getMonacoLanguage = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'java':
        return 'java';
      case 'python':
      case 'python3':
      case 'py':
        return 'python';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-inner">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-blue-400 font-semibold uppercase tracking-wider">
            {language}
          </span>
          <div className="h-4 w-px bg-slate-700"></div>
          {mode === 'strict' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              STRICT RAW MODE (No Autocomplete / Auto-Brackets)
            </span>
          )}
          {mode === 'practice' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              PRACTICE MODE
            </span>
          )}
          {mode === 'learning' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              LEARNING MODE
            </span>
          )}
        </div>

        {/* Editor Mode Selector */}
        {!isModeLocked && onModeChange && (
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded p-0.5 text-xs">
            <button
              onClick={() => onModeChange('strict')}
              className={`px-2.5 py-1 rounded transition-colors ${
                mode === 'strict'
                  ? 'bg-red-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Strict Raw Mode (Default TCS Assessment Mode)"
            >
              Strict
            </button>
            <button
              onClick={() => onModeChange('practice')}
              className={`px-2.5 py-1 rounded transition-colors ${
                mode === 'practice'
                  ? 'bg-blue-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Practice
            </button>
            <button
              onClick={() => onModeChange('learning')}
              className={`px-2.5 py-1 rounded transition-colors ${
                mode === 'learning'
                  ? 'bg-emerald-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Learning
            </button>
          </div>
        )}

        {isModeLocked && (
          <span className="text-slate-500 font-mono text-[11px]">
            Mode locked during strict assessment
          </span>
        )}
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-[300px]">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={value}
          onChange={(val) => onChange(val || '')}
          theme="vs-dark"
          options={getMonacoOptions(mode)}
        />
      </div>
    </div>
  );
};
