import type { editor } from 'monaco-editor';

export type EditorMode = 'strict' | 'practice' | 'learning';

export const getMonacoOptions = (mode: EditorMode = 'strict'): editor.IStandaloneEditorConstructionOptions => {
  if (mode === 'strict') {
    return {
      // STRICT RAW MODE CONSTRAINTS
      autoClosingBrackets: 'never',
      autoClosingQuotes: 'never',
      autoClosingOvertype: 'never',
      autoSurround: 'never',
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      snippetSuggestions: 'none',
      wordBasedSuggestions: 'off',
      suggest: {
        showKeywords: false,
        showSnippets: false,
        showFunctions: false,
        showVariables: false,
        showConstants: false,
        showWords: false
      },
      inlineSuggest: { enabled: false },
      formatOnType: false,
      formatOnPaste: false,
      autoIndent: 'none',
      tabCompletion: 'off',
      parameterHints: { enabled: false },
      links: false,
      fontFamily: "'Fira Code', monospace",
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      renderLineHighlight: 'line',
      lineNumbers: 'on'
    };
  }

  if (mode === 'practice') {
    return {
      autoClosingBrackets: 'languageDefined',
      autoClosingQuotes: 'languageDefined',
      quickSuggestions: true,
      snippetSuggestions: 'inline',
      formatOnType: false,
      formatOnPaste: false,
      fontFamily: "'Fira Code', monospace",
      fontSize: 14,
      minimap: { enabled: false },
      automaticLayout: true,
      lineNumbers: 'on'
    };
  }

  // LEARNING MODE
  return {
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    quickSuggestions: true,
    snippetSuggestions: 'top',
    parameterHints: { enabled: true },
    fontFamily: "'Fira Code', monospace",
    fontSize: 14,
    minimap: { enabled: true },
    automaticLayout: true,
    lineNumbers: 'on'
  };
};
