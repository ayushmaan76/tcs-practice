import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { AssessmentScreen } from './pages/AssessmentScreen';
import { MockTestPage } from './pages/MockTestPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/questions" element={<QuestionBankPage />} />
              <Route path="/questions/:idOrSlug" element={<AssessmentScreen />} />
              <Route path="/mock-test" element={<MockTestPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};
