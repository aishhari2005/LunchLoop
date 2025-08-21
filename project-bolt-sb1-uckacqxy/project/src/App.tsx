import { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/auth/AuthForm';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MainContent } from './components/layout/MainContent';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function App() {
  const { user, userProfile, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || !userProfile) {
    return (
      <>
        <AuthForm 
          mode={authMode} 
          onToggleMode={() => setAuthMode(mode => mode === 'login' ? 'register' : 'login')} 
        />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 p-6">
            <MainContent activeTab={activeTab} />
          </main>
        </div>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;