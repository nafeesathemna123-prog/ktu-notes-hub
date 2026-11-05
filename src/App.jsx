import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DepartmentSection } from './components/DepartmentSection';
import { SemesterSection } from './components/SemesterSection';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';
import { Modal } from './components/Modal';
import { BookOpen, Shield, GraduationCap, CheckCircle2 } from 'lucide-react';

function App() {
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('btech-aids');
  const [browseModalOpen, setBrowseModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [searchFeedback, setSearchFeedback] = useState(null);

  const handleBrowseNotes = () => {
    setSearchFeedback(null);
    setBrowseModalOpen(true);
  };

  const handleSearchSubmit = (query) => {
    if (!query || !query.trim()) return;
    setSearchFeedback(query.trim());
    setBrowseModalOpen(true);
  };

  const handleAdminPortal = () => {
    setAdminModalOpen(true);
  };

  const handleProgrammeSelect = (dept) => {
    setSelectedProgrammeId(dept.id);
  };

  const handleSemesterSelect = (sem) => {
    setSelectedEntity({
      type: 'semester',
      title: `${sem.programmeName} — ${sem.title} (${sem.phase})`,
      subtitle: `${sem.programmeScheme} • ${sem.focus}`,
      description: sem.description,
      note: 'Verified notes, module files, and PDF materials for this active semester are being curated by administrators. Direct access and downloads will be enabled in Phase 2.',
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F5ED] text-[#303846] flex flex-col selection:bg-[#DCE5EF] selection:text-[#243B53]">
      {/* Top Navigation */}
      <Navbar
        onBrowseClick={handleBrowseNotes}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero
          onSearchSubmit={handleSearchSubmit}
          onBrowseClick={handleBrowseNotes}
        />

        {/* Browse by Programme (College's 7 Active Courses) */}
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
      </main>

      {/* Footer */}
      <Footer
        onAdminClick={handleAdminPortal}
        onBrowseClick={handleBrowseNotes}
      />

      {/* Browse Notes / Search Modal (Phase 1 Notice) */}
      <Modal
        isOpen={browseModalOpen}
        onClose={() => setBrowseModalOpen(false)}
        title={searchFeedback ? `Search: "${searchFeedback}"` : "Student Notes Library"}
        subtitle="Phase 1 Active • Phase 2 Coming Next"
        icon={BookOpen}
      >
        <div className="space-y-3">
          <p>
            {searchFeedback ? (
              <span>
                Searching for <strong>&ldquo;{searchFeedback}&rdquo;</strong> across the college academic library.
              </span>
            ) : (
              <span>
                Welcome to the KTU Notes Hub central repository.
              </span>
            )}
          </p>
          <div className="p-3.5 rounded-xl bg-[#EAF0F6] border border-[#DCE5EF] text-xs space-y-1.5">
            <div className="font-heading font-semibold text-[#243B53] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>College Scope: 7 Programmes & 11 Semesters Configured</span>
            </div>
            <p className="text-[#475569]">
              In Phase 2, the dedicated public Browse Notes page will provide live subject search, multi-level filters (Programme, Semester, Subject, Module), in-browser PDF viewing, and direct downloads.
            </p>
          </div>
          <p className="text-xs text-[#475569]">
            Remember: Students enjoy 100% free access without accounts, profiles, or login credentials.
          </p>
        </div>
      </Modal>

      {/* Admin Portal Modal */}
      <Modal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        title="Administrator Portal"
        subtitle="Restricted Academic Management Access"
        icon={Shield}
      >
        <div className="space-y-3">
          <p>
            This portal is strictly reserved for authorized administrators to upload, manage, edit, and publish verified academic notes for our college students.
          </p>
          <div className="p-3.5 rounded-xl bg-[#F0F2F5] border border-[#DCE5EF] text-xs space-y-1.5">
            <span className="font-heading font-semibold text-[#243B53] block">
              Dynamic Architecture Ready:
            </span>
            <p className="text-[#475569]">
              The backend architecture supports adding new courses, activating higher semesters, and uploading PDF notes via Supabase. Admin login and dashboard controls will be implemented in Phase 3 and connected to Supabase RLS in Phase 4.
            </p>
          </div>
        </div>
      </Modal>

      {/* Selected Semester Modal */}
      <Modal
        isOpen={!!selectedEntity}
        onClose={() => setSelectedEntity(null)}
        title={selectedEntity?.title || ''}
        subtitle={selectedEntity?.subtitle || ''}
        icon={selectedEntity?.type === 'semester' ? GraduationCap : BookOpen}
      >
        <div className="space-y-3">
          <p className="text-sm text-[#303846]">
            {selectedEntity?.description}
          </p>
          <div className="p-3.5 rounded-xl bg-[#EAF0F6] border border-[#DCE5EF] text-xs">
            <span className="font-heading font-semibold text-[#243B53] block mb-1">
              Curriculum Note:
            </span>
            <p className="text-[#475569]">
              {selectedEntity?.note}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
