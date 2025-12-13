import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import AISearch from './components/search/AISearch';
import DeepResearch from './components/search/DeepResearch';
import ReferenceLibrary from './components/library/ReferenceLibrary';
import PDFReader from './components/reader/PDFReader';
import LitReviewWorkbench from './components/review/LitReviewWorkbench';
import AIWriter from './components/writer/AIWriter';
import ResearchChat from './components/ResearchChat';
import ArchitectureViewer from './components/ArchitectureViewer';
import Settings from './components/settings/Settings';
import ProfilePage from './components/profile/ProfilePage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserMenu from './components/auth/UserMenu';
import { ViewState, Paper } from './types';
import './index.css';

// Main authenticated app content
const AuthenticatedApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('search');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [library, setLibrary] = useState<Paper[]>([]);

  const handleViewChange = (view: ViewState) => {
    console.log('handleViewChange called with:', view, 'current view:', currentView);
    setCurrentView(view);
    setSidebarOpen(false);
    console.log('View should now be:', view);
  };

  const handleGlobalSearch = (query: string) => {
    setCurrentView('search');
  };

  const handleAddToLibrary = (paper: Paper) => {
    setLibrary(prev => {
      if (prev.some(p => p.id === paper.id)) return prev;
      return [...prev, { ...paper, addedAt: new Date() }];
    });
  };

  const handleOpenPaper = (paper: Paper) => {
    setSelectedPaper(paper);
    setCurrentView('reader');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'search':
        return (
          <AISearch
            onAddToLibrary={handleAddToLibrary}
            onOpenPaper={handleOpenPaper}
          />
        );
      case 'deep-research':
        return <DeepResearch />;
      case 'library':
        return (
          <ReferenceLibrary
            papers={library}
            onOpenPaper={handleOpenPaper}
            onRemovePaper={(id) => setLibrary(prev => prev.filter(p => p.id !== id))}
          />
        );
      case 'reader':
        return (
          <PDFReader
            paper={selectedPaper}
            onBack={() => setCurrentView('library')}
          />
        );
      case 'review':
        return (
          <LitReviewWorkbench
            papers={library}
          />
        );
      case 'writer':
        return (
          <AIWriter
            library={library}
          />
        );
      case 'chat':
        return <ResearchChat />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <ProfilePage />;
      case 'architecture':
        return <ArchitectureViewer />;
      default:
        return <AISearch onAddToLibrary={handleAddToLibrary} onOpenPaper={handleOpenPaper} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="main-content">
        <TopBar
          onSearch={handleGlobalSearch}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={true}
          rightContent={<UserMenu onViewChange={handleViewChange} />}
        />
        <main className="content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Root App with routing
const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

