import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Layers,
  FileText,
  Download,
  Eye,
  Search,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { academicService } from '../services/academicService';

export function NotesExplorer({ initialProgrammeId = 'btech-aids', initialSemesterNumber = 1, onBackToHome }) {
  const [programmes, setProgrammes] = useState([]);
  const [selectedProgId, setSelectedProgId] = useState(initialProgrammeId);
  const [selectedSemNumber, setSelectedSemNumber] = useState(initialSemesterNumber);
  
  // Hierarchy state
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [notes, setNotes] = useState([]);

  // UI state
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [downloadingNoteId, setDownloadingNoteId] = useState(null);
  const [previewingNoteId, setPreviewingNoteId] = useState(null);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [fetchError, setFetchError] = useState(null);

  // Load programmes once on mount
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const progList = await academicService.getProgrammes();
        if (active) {
          setProgrammes(progList);
        }
      } catch (err) {
        console.error('Error loading programmes in NotesExplorer:', err);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  const currentProgramme = programmes.find((p) => p.id === selectedProgId) || programmes[0];
  const availableSemesters = currentProgramme?.availableSemesters || [];
  const currentSemester = availableSemesters.find((s) => s.semesterNumber === selectedSemNumber) || availableSemesters[0];

  const handleSelectProgramme = (progId) => {
    setSelectedProgId(progId);
    const prog = programmes.find((p) => p.id === progId);
    const firstSem = prog?.availableSemesters?.[0]?.semesterNumber || 1;
    setSelectedSemNumber(firstSem);
    setSelectedSubject(null);
    setSelectedModule(null);
    setModules([]);
    setNotes([]);
  };

  const handleSelectSemester = (semNum) => {
    setSelectedSemNumber(semNum);
    setSelectedSubject(null);
    setSelectedModule(null);
    setModules([]);
    setNotes([]);
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedModule(null);
    setNotes([]);
  };

  // Load subjects when currentSemester?.id changes
  useEffect(() => {
    if (!currentSemester?.id) return;
    let active = true;

    async function fetchSubjects() {
      setLoadingSubjects(true);
      setFetchError(null);
      try {
        const subs = await academicService.getSubjects(currentSemester.id);
        if (active) {
          setSubjects(subs);
        }
      } catch (err) {
        if (active) setFetchError(err.message || 'Could not load subjects for this semester.');
      } finally {
        if (active) setLoadingSubjects(false);
      }
    }

    fetchSubjects();
    return () => { active = false; };
  }, [currentSemester?.id]);

  // Load modules when selectedSubject?.id changes
  useEffect(() => {
    if (!selectedSubject?.id) return;
    let active = true;

    async function fetchModules() {
      setLoadingModules(true);
      try {
        const mods = await academicService.getModules(selectedSubject.id);
        if (active) {
          setModules(mods);
          if (mods.length > 0) {
            setSelectedModule(mods[0]);
          } else {
            setSelectedModule(null);
          }
        }
      } catch (err) {
        console.error('Error loading modules:', err);
      } finally {
        if (active) setLoadingModules(false);
      }
    }

    fetchModules();
    return () => { active = false; };
  }, [selectedSubject?.id]);

  // Load published notes when selectedModule?.id changes
  useEffect(() => {
    if (!selectedModule?.id) return;
    let active = true;

    async function fetchNotes() {
      setLoadingNotes(true);
      try {
        const publishedNotes = await academicService.getPublishedNotes(selectedModule.id);
        if (active) setNotes(publishedNotes);
      } catch (err) {
        console.error('Error loading notes:', err);
      } finally {
        if (active) setLoadingNotes(false);
      }
    }

    fetchNotes();
    return () => { active = false; };
  }, [selectedModule?.id]);

  // Download handler
  const handleDownload = async (note) => {
    setDownloadingNoteId(note.id);
    try {
      await academicService.downloadNote(note);
    } catch (err) {
      alert(`Download notice: ${err.message || 'File could not be downloaded.'}`);
    } finally {
      setDownloadingNoteId(null);
    }
  };

  // Preview handler
  const handlePreview = async (note) => {
    setPreviewingNoteId(note.id);
    try {
      await academicService.previewNote(note);
    } catch (err) {
      alert(`Preview notice: ${err.message || 'File could not be opened.'}`);
    } finally {
      setPreviewingNoteId(null);
    }
  };

  // Filtered subjects
  const filteredSubjects = subjects.filter((s) => {
    if (!subjectSearch.trim()) return true;
    const term = subjectSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.code && s.code.toLowerCase().includes(term))
    );
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return 'PDF Document';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="min-h-screen bg-[#F8F5ED] text-[#303846]">
      {/* Top Header / Explorer Bar */}
      <div className="bg-white border-b border-[#DCE5EF] sticky top-20 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-heading">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 text-[#475569] hover:text-[#243B53] font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#475569]/50" />
              <span className="font-semibold text-[#243B53]">
                {currentProgramme?.name || 'Programme'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#475569]/50" />
              <span className="font-semibold text-[#B49A70]">
                {currentSemester?.title || 'Semester'}
              </span>
              {selectedSubject && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-[#475569]/50" />
                  <span className="font-medium text-[#475569] truncate max-w-[140px] sm:max-w-xs">
                    {selectedSubject.name}
                  </span>
                </>
              )}
            </div>

            {/* Quick Scope Banner */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF0F6] border border-[#DCE5EF] text-[11px] font-heading font-semibold text-[#243B53]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#B49A70]" />
                <span>Free Public Access • No Login Required</span>
              </span>
            </div>

          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {fetchError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            {fetchError}
          </div>
        )}

        {/* Step 1: Programme Selection (Strict Order 1 to 7) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-heading font-semibold tracking-wider uppercase text-[#475569]">
              1. Select Programme
            </span>
            <span className="text-xs text-[#475569]">
              7 Offered College Programmes
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {programmes.map((prog, idx) => {
              const isSelected = prog.id === currentProgramme?.id;
              return (
                <button
                  key={prog.id}
                  type="button"
                  onClick={() => handleSelectProgramme(prog.id)}
                  className={`relative p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#243B53] text-white border-[#243B53] shadow-sm ring-2 ring-[#B49A70]/30'
                      : 'bg-white text-[#303846] border-[#DCE5EF] hover:border-[#B49A70]/50 hover:bg-[#F0F2F5]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-[10px] font-bold font-heading px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#EAF0F6] text-[#243B53]'
                    }`}>
                      #{idx + 1}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B49A70]" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs sm:text-sm leading-snug truncate">
                      {prog.name}
                    </h4>
                    <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#475569]'}`}>
                      {prog.availableSemesters?.length} {prog.availableSemesters?.length === 1 ? 'Sem' : 'Sems'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Semester Selection */}
        <div className="mb-10 p-5 rounded-2xl bg-white border border-[#DCE5EF] shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-semibold tracking-wider uppercase text-[#475569]">
                  2. Select Active Semester
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#EAF0F6] text-[10px] font-heading font-semibold text-[#243B53]">
                  {currentProgramme?.scheme}
                </span>
              </div>
              <h3 className="font-heading font-bold text-lg text-[#243B53] mt-0.5">
                {currentProgramme?.fullName}
              </h3>
            </div>

            {/* Semester Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {availableSemesters.map((sem) => {
                const isSelected = sem.semesterNumber === selectedSemNumber;
                return (
                  <button
                    key={sem.id}
                    type="button"
                    onClick={() => handleSelectSemester(sem.semesterNumber)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#B49A70] text-white shadow-xs'
                        : 'bg-[#F0F2F5] hover:bg-[#DCE5EF] text-[#303846] border border-[#DCE5EF]'
                    }`}
                  >
                    <span>{sem.title}</span>
                    <span className="text-[10px] opacity-80 ml-1.5">({sem.phase})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {currentSemester?.focus && (
            <p className="text-xs text-[#475569] border-t border-[#DCE5EF] pt-3">
              <span className="font-semibold text-[#243B53]">Semester Focus:</span> {currentSemester.focus}
            </p>
          )}
        </div>

        {/* Step 3 & 4: Subjects and Notes Explorer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Subjects Column (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-heading font-semibold tracking-wider uppercase text-[#475569] block">
                  3. Academic Subjects
                </span>
                <h3 className="font-heading font-bold text-xl text-[#243B53]">
                  Course Subjects
                </h3>
              </div>
              <span className="text-xs font-heading font-bold px-2 py-1 rounded-md bg-white border border-[#DCE5EF] text-[#243B53]">
                {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
              </span>
            </div>

            {/* Search Input for Subjects */}
            {subjects.length > 0 && (
              <div className="relative">
                <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Filter subjects by name or code..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCE5EF] rounded-xl text-xs sm:text-sm font-sans placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#B49A70]/50"
                />
              </div>
            )}

            {/* Loading State */}
            {loadingSubjects && (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#DCE5EF]">
                <div className="w-6 h-6 border-2 border-[#243B53] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#475569]">Loading curriculum subjects...</p>
              </div>
            )}

            {/* Empty State: No subjects in database yet */}
            {!loadingSubjects && subjects.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#DCE5EF] shadow-2xs">
                <div className="w-12 h-12 rounded-xl bg-[#EAF0F6] flex items-center justify-center text-[#243B53] mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-[#B49A70]" />
                </div>
                <h4 className="font-heading font-bold text-base text-[#243B53] mb-1">
                  Subjects Under Curation
                </h4>
                <p className="text-xs text-[#475569] leading-relaxed max-w-sm mx-auto mb-4">
                  Verified syllabus coursework and course subjects for {currentProgramme?.name} {currentSemester?.title} are currently being configured by college administrators.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#F0F2F5] text-[11px] text-[#475569] border border-[#DCE5EF]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Dynamic Admin Management Ready</span>
                </div>
              </div>
            )}

            {/* Subject Cards List */}
            {!loadingSubjects && subjects.length > 0 && (
              <div className="space-y-3">
                {filteredSubjects.length === 0 ? (
                  <p className="text-xs text-[#475569] text-center py-6 bg-white rounded-xl border border-[#DCE5EF]">
                    No subjects match &ldquo;{subjectSearch}&rdquo;.
                  </p>
                ) : (
                  filteredSubjects.map((sub) => {
                    const isSelected = selectedSubject?.id === sub.id;
                    return (
                      <motion.div
                        key={sub.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectSubject(sub)}
                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-white border-[#243B53] shadow-md ring-2 ring-[#B49A70]/30'
                            : 'bg-white border-[#DCE5EF] hover:border-[#B49A70]/60 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2">
                            {sub.code && (
                              <span className="px-2 py-0.5 rounded bg-[#EAF0F6] text-[11px] font-heading font-bold text-[#243B53] border border-[#DCE5EF]">
                                {sub.code}
                              </span>
                            )}
                            {sub.credits && (
                              <span className="text-[11px] text-[#475569]">
                                {sub.credits} Credits
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-heading font-semibold text-[#B49A70]">
                              <span>Selected</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <h4 className="font-heading font-bold text-base text-[#243B53] mb-1">
                          {sub.name}
                        </h4>

                        {sub.description && (
                          <p className="text-xs text-[#475569] line-clamp-2 mb-3">
                            {sub.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-[#475569] pt-2 border-t border-[#DCE5EF]/60">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Layers className="w-3.5 h-3.5 text-[#B49A70]" />
                            {sub.activeModuleCount || 0} Modules configured
                          </span>
                          <span className="font-heading font-semibold text-[#243B53] text-[11px]">
                            Explore Notes &rarr;
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Right Column: Modules & Notes (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-5">
            {!selectedSubject ? (
              <div className="bg-white rounded-2xl border border-[#DCE5EF] p-10 text-center shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-[#EAF0F6] flex items-center justify-center text-[#243B53] mx-auto mb-4">
                  <Layers className="w-7 h-7 text-[#B49A70]" />
                </div>
                <h4 className="font-heading font-bold text-lg text-[#243B53] mb-2">
                  Select a Subject to View Modules & Notes
                </h4>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-md mx-auto">
                  Click any subject from the left panel to browse its official curriculum modules and access verified, printable PDF lecture notes.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Selected Subject Header */}
                <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#DCE5EF]">
                    <div>
                      <span className="text-xs font-heading font-semibold tracking-wider uppercase text-[#B49A70] block">
                        Subject Details
                      </span>
                      <h3 className="font-heading font-bold text-xl text-[#243B53]">
                        {selectedSubject.name}
                      </h3>
                    </div>
                    {selectedSubject.code && (
                      <span className="self-start sm:self-auto font-heading font-bold text-xs px-3 py-1 rounded-md bg-[#243B53] text-white">
                        {selectedSubject.code}
                      </span>
                    )}
                  </div>

                  {/* Step 4: Module Selection Tabs */}
                  <div>
                    <span className="text-xs font-heading font-semibold text-[#475569] block mb-2">
                      4. Select Module (Modules 1 to 6)
                    </span>

                    {loadingModules ? (
                      <p className="text-xs text-[#475569]">Loading subject modules...</p>
                    ) : modules.length === 0 ? (
                      <p className="text-xs text-[#475569] bg-[#F0F2F5] p-3 rounded-xl border border-[#DCE5EF]">
                        No modules have been configured for this subject yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {modules.map((mod) => {
                          const isSelected = selectedModule?.id === mod.id;
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => setSelectedModule(mod)}
                              className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-[#243B53] text-white shadow-xs'
                                  : 'bg-[#F0F2F5] hover:bg-[#DCE5EF] text-[#303846] border border-[#DCE5EF]'
                              }`}
                            >
                              <span>Module {mod.module_number}</span>
                              {mod.publishedNotesCount > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                  isSelected ? 'bg-[#B49A70] text-white' : 'bg-white text-[#243B53]'
                                }`}>
                                  {mod.publishedNotesCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 5: Published PDF Notes for Selected Module */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-heading font-semibold tracking-wider uppercase text-[#475569] block">
                        5. Published Notes
                      </span>
                      <h4 className="font-heading font-bold text-lg text-[#243B53]">
                        {selectedModule ? `Module ${selectedModule.module_number}: ${selectedModule.title}` : 'Notes'}
                      </h4>
                    </div>
                    {notes.length > 0 && (
                      <span className="text-xs text-[#475569]">
                        {notes.length} PDF {notes.length === 1 ? 'file' : 'files'}
                      </span>
                    )}
                  </div>

                  {selectedModule?.description && (
                    <p className="text-xs text-[#475569] bg-white p-3.5 rounded-xl border border-[#DCE5EF]">
                      {selectedModule.description}
                    </p>
                  )}

                  {/* Loading Notes */}
                  {loadingNotes && (
                    <div className="p-8 text-center bg-white rounded-2xl border border-[#DCE5EF]">
                      <div className="w-6 h-6 border-2 border-[#243B53] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-[#475569]">Loading published PDF notes...</p>
                    </div>
                  )}

                  {/* Empty State: No notes in this module */}
                  {!loadingNotes && selectedModule && notes.length === 0 && (
                    <div className="p-8 text-center bg-white rounded-2xl border border-[#DCE5EF] shadow-2xs">
                      <div className="w-12 h-12 rounded-xl bg-[#EAF0F6] flex items-center justify-center text-[#243B53] mx-auto mb-3">
                        <FileText className="w-6 h-6 text-[#B49A70]" />
                      </div>
                      <h4 className="font-heading font-bold text-base text-[#243B53] mb-1">
                        No Notes Published Yet
                      </h4>
                      <p className="text-xs text-[#475569] max-w-sm mx-auto mb-3">
                        Verified lecture notes and PDF revision guides for Module {selectedModule.module_number} have not yet been published by administrators.
                      </p>
                      <span className="text-[11px] text-[#475569] bg-[#F0F2F5] px-3 py-1 rounded-md border border-[#DCE5EF]">
                        Check back soon as faculty publishes additional modules
                      </span>
                    </div>
                  )}

                  {/* Notes Cards List */}
                  {!loadingNotes && notes.length > 0 && (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs hover:border-[#B49A70]/50 transition-all duration-200"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-grow">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EAF0F6] text-[#243B53] border border-[#DCE5EF]">
                                  <FileText className="w-3 h-3 text-[#B49A70]" />
                                  <span>PDF Notes</span>
                                </span>
                                <span className="text-[11px] text-[#475569]">
                                  {formatFileSize(note.file_size_bytes)}
                                </span>
                                {note.download_count > 0 && (
                                  <span className="text-[11px] text-[#475569]">
                                    • {note.download_count} {note.download_count === 1 ? 'download' : 'downloads'}
                                  </span>
                                )}
                              </div>

                              <h5 className="font-heading font-bold text-base text-[#243B53]">
                                {note.title}
                              </h5>

                              {note.description && (
                                <p className="text-xs text-[#475569] leading-relaxed">
                                  {note.description}
                                </p>
                              )}
                            </div>

                            {/* Actions: Download & Preview */}
                            <div className="flex sm:flex-col items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={downloadingNoteId === note.id}
                                onClick={() => handleDownload(note)}
                                className="w-full sm:w-36 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#243B53] hover:bg-[#1A2B3C] text-white text-xs font-heading font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                {downloadingNoteId === note.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5 text-[#B49A70]" />
                                )}
                                <span>Download PDF</span>
                              </button>

                              <button
                                type="button"
                                disabled={previewingNoteId === note.id}
                                onClick={() => handlePreview(note)}
                                className="w-full sm:w-36 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#EAF0F6] text-[#243B53] text-xs font-heading font-semibold border border-[#DCE5EF] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {previewingNoteId === note.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-[#243B53] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5 text-[#475569]" />
                                )}
                                <span>View PDF</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
