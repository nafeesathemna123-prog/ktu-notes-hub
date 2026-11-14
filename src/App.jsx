import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DepartmentSection } from './components/DepartmentSection';
import { SemesterSection } from './components/SemesterSection';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';
import { NotesExplorer } from './components/NotesExplorer';
import { AdminLoginModal } from './components/admin/AdminLoginModal';

const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

function AppContent() {
  const { isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'browse' | 'admin'
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('btech-aids');
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState(1);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        if (isAdmin) {
          setCurrentView('admin');
        } else {
          setAdminModalOpen(true);
        }
      } else if (hash.startsWith('#browse')) {
        setCurrentView('browse');
      } else if (hash === '#home' || hash === '') {
        setCurrentView('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAdmin]);

  const navigateTo = (view, hash = '') => {
    setCurrentView(view);
    if (hash) {
      window.location.hash = hash;
    } else if (view === 'browse') {
      window.location.hash = '#browse';
    } else if (view === 'admin') {
      window.location.hash = '#admin';
    } else {
      window.location.hash = '#home';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBrowseNotes = () => {
    navigateTo('browse');
  };

  const handleSearchSubmit = () => {
    navigateTo('browse');
  };

  const handleProgrammeSelect = (dept) => {
    setSelectedProgrammeId(dept.id);
  };

  const handleSemesterSelect = (sem) => {
    setSelectedProgrammeId(sem.programmeId || selectedProgrammeId);
    setSelectedSemesterNumber(sem.semesterNumber);
    navigateTo('browse');
  };

  const handleAdminPortalClick = () => {
    if (isAdmin) {
      navigateTo('admin');
    } else {
      setAdminModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    navigateTo('admin');
  };

  // If in admin view and user is an administrator
  if (currentView === 'admin' && isAdmin) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F8F5ED] flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#243B53] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <AdminDashboard onExit={() => navigateTo('home')} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5ED] text-[#303846] flex flex-col selection:bg-[#DCE5EF] selection:text-[#243B53]">
      
      {/* Top Navigation */}
      <Navbar
        onBrowseClick={handleBrowseNotes}
        onAdminClick={handleAdminPortalClick}
        onOpenAdminDashboard={() => navigateTo('admin')}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {currentView === 'browse' ? (
          <NotesExplorer
            initialProgrammeId={selectedProgrammeId}
            initialSemesterNumber={selectedSemesterNumber}
            onBackToHome={() => navigateTo('home')}
          />
        ) : (
          <>
            {/* Hero Section */}
            <Hero
              onSearchSubmit={handleSearchSubmit}
              onBrowseClick={handleBrowseNotes}
            />

            {/* Browse by Programme (College's 7 Active Courses in Approved Order) */}
            <DepartmentSection
              selectedProgrammeId={selectedProgrammeId}
              onProgrammeSelect={handleProgrammeSelect}
            />

            {/* Browse by Semester (Shows ONLY the semesters available under selected programme) */}
            <SemesterSection
              selectedProgrammeId={selectedProgrammeId}
              onProgrammeChange={setSelectedProgrammeId}
              onSemesterSelect={handleSemesterSelect}
            />

            {/* About Section */}
            <AboutSection />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onAdminClick={handleAdminPortalClick}
        onBrowseClick={handleBrowseNotes}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
