import React, { useState } from 'react';
import { adminService } from '../services/api';
import { ShieldCheck, Download, Upload, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Arrays');
  const [difficulty, setDifficulty] = useState('Easy');
  const [description, setDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraintsStr, setConstraintsStr] = useState('1 <= N <= 100000');

  const [message, setMessage] = useState('');
  const [importJson, setImportJson] = useState('');

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createQuestion({
        title,
        category,
        difficulty,
        description,
        input_format: inputFormat,
        output_format: outputFormat,
        constraints: constraintsStr.split('\n').filter(Boolean),
        examples: [{ input: "5\n1 2 3 4 5", output: "15", explanation: "Sample explanation" }],
        test_cases: [
          { input_data: "5\n1 2 3 4 5", expected_output: "15", test_type: "public", is_sample: true },
          { input_data: "3\n10 20 30", expected_output: "60", test_type: "hidden", is_sample: false }
        ]
      });
      setMessage("Question created and published successfully!");
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setMessage(`Error creating question: ${err.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const data = await adminService.exportQuestions();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tcs_question_bank_export_${Date.now()}.json`;
      a.click();
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      const res = await adminService.importQuestions(parsed);
      alert(res.message);
      setImportJson('');
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/40 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Admin Question Catalog Management
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Create, edit, publish, import, and export TCS assessment questions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-blue-400" /> Export JSON
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Grid: Create Question Form & Import JSON Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Question Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-400" /> Create New Assessment Question
          </h3>

          <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Question Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Find Duplicates in Array"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Number Problems">Number Problems</option>
                  <option value="If-Else & Word Problems">If-Else & Word Problems</option>
                  <option value="Arrays">Arrays</option>
                  <option value="Strings">Strings</option>
                  <option value="Hashing, Sorting & Searching">Hashing, Sorting & Searching</option>
                  <option value="Linked List, Stack & Queue">Linked List, Stack & Queue</option>
                  <option value="Greedy, DP & Graphs">Greedy, DP & Graphs</option>
                  <option value="Matrix Problems">Matrix Problems</option>
                  <option value="Recursion & Backtracking">Recursion & Backtracking</option>
                  <option value="Bit Manipulation">Bit Manipulation</option>
                  <option value="Pattern Problems">Pattern Problems</option>
                  <option value="Basic Mathematics">Basic Mathematics</option>
                  <option value="TCS-Style Mixed Problems">TCS-Style Mixed Problems</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Problem Statement</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Detailed formal assessment problem description..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-purple-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Input Format</label>
                <textarea
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Output Format</label>
                <textarea
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg transition-colors"
            >
              Publish Question
            </button>
          </form>
        </div>

        {/* JSON Bulk Import Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" /> JSON Bulk Import
          </h3>
          <p className="text-xs text-slate-400">
            Paste JSON question payload to import questions and test cases into the database.
          </p>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            rows={12}
            placeholder={`{\n  "questions": [\n    {\n      "title": "Sample Q",\n      "category": "Arrays",\n      "difficulty": "Easy",\n      "description": "..."\n    }\n  ]\n}`}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleImport}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg transition-colors"
          >
            Run Import Payload
          </button>
        </div>
      </div>
    </div>
  );
};
