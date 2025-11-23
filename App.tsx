
import React, { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Pomodoro } from './components/Pomodoro';
import { AIChat } from './components/AIChat';
import { SubjectManager } from './components/SubjectManager';
import { Analytics } from './components/Analytics';
import { Leaderboard } from './components/Leaderboard';
import { Store } from './components/Store';
import { Auth } from './components/Auth';
import { Settings } from './components/Settings';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const { currentView, darkMode, isAuthenticated, initialize, isLoading } = useStore();

  // Initialize session and theme
  useEffect(() => {
    initialize();
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [initialize, darkMode]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'subjects':
        return <SubjectManager />;
      case 'pomodoro':
        return <Pomodoro />;
      case 'ai-tutor':
        return <AIChat />;
      case 'analytics':
        return <Analytics />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'store':
        return <Store />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-in fade-in duration-500">
        <Auth />
      </div>
    );
  }

  return (
    <Layout>
      <div className="animate-in fade-in duration-500">
        {renderView()}
      </div>
    </Layout>
  );
};

export default App;
