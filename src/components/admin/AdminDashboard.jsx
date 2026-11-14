import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Layers,
  FileText,
  Upload,
  Plus,
  BookOpen,
  GraduationCap,
  Trash2,
  CheckCircle2,
  Eye,
  LogOut,
  ArrowLeft,
  Search,
  AlertCircle,
  RefreshCw,
  FileUp,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { adminService } from '../../services/adminService';
import { academicService } from '../../services/academicService';

export function AdminDashboard({ onExit }) {
  const { user, adminProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'hierarchy' | 'notes'
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState(null);

  // Academic data
  const [programmes, setProgrammes] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [notes, setNotes] = useState([]);

  // Notes filtering & searching
  const [noteStatusFilter, setNoteStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [notesSearch, setNotesSearch] = useState('');

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [schemeModalOpen, setSchemeModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  // Form states
  const [uploadFormData, setUploadFormData] = useState({
    programmeId: '',
    semesterId: '',
    subjectId: '',
    moduleId: '',
    title: '',
    description: '',
    file: null,
    isPublished: true,
  });

  const [subjectFormData, setSubjectFormData] = useState({
    programmeSemesterId: '',
    code: '',
    name: '',
    credits: 3,
    description: '',
  });

  const [moduleFormData, setModuleFormData] = useState({
    subjectId: '',
    moduleNumber: 1,
    title: '',
    description: '',
  });

  const [schemeFormData, setSchemeFormData] = useState({
    id: '',
    name: '',
    year: new Date().getFullYear(),
    description: '',
  });

  const [batchFormData, setBatchFormData] = useState({
    id: '',
    programmeId: '',
    schemeId: '',
    name: '',
    academicYear: '2024-2025',
    startYear: 2024,
    endYear: 2028,
  });

  // Action status / Notifications
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Initial load
  useEffect(() => {
    let isSubscribed = true;
    Promise.all([
      adminService.getDashboardMetrics(),
      adminService.getAllProgrammes(),
      adminService.getAllSemesters(),
      adminService.getAllSchemes(),
      adminService.getAllBatches(),
      adminService.getAllSubjects(),
      adminService.getAllModules(),
      adminService.getAllNotes(),
    ]).then(([metricsData, progList, semList, schemeList, batchList, subList, modList, noteList]) => {
      if (isSubscribed) {
        setMetrics(metricsData);
        setProgrammes(progList);
        setSemesters(semList);
        setSchemes(schemeList);
        setBatches(batchList);
        setSubjects(subList);
        setModules(modList);
        setNotes(noteList);
      }
    }).catch((err) => {
      console.error('Error fetching admin dashboard data:', err);
    });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Refresh callback for action handlers
  const refreshAllData = useCallback(async () => {
    try {
      const [
        metricsData,
        progList,
        semList,
        schemeList,
        batchList,
        subList,
        modList,
        noteList,
      ] = await Promise.all([
        adminService.getDashboardMetrics(),
        adminService.getAllProgrammes(),
        adminService.getAllSemesters(),
        adminService.getAllSchemes(),
        adminService.getAllBatches(),
        adminService.getAllSubjects(),
        adminService.getAllModules(),
        adminService.getAllNotes(),
      ]);

      setMetrics(metricsData);
      setProgrammes(progList);
      setSemesters(semList);
      setSchemes(schemeList);
      setBatches(batchList);
      setSubjects(subList);
      setModules(modList);
      setNotes(noteList);
    } catch (err) {
      console.error('Error refreshing admin dashboard data:', err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFormData.file) {
      showNotification('error', 'Please select a PDF file to upload.');
      return;
    }
    if (!uploadFormData.moduleId) {
      showNotification('error', 'Please select a target module.');
      return;
    }
    if (!uploadFormData.title.trim()) {
      showNotification('error', 'Please enter a note title.');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.uploadNote({
        file: uploadFormData.file,
        moduleId: uploadFormData.moduleId,
        title: uploadFormData.title,
        description: uploadFormData.description,
        isPublished: uploadFormData.isPublished,
        adminUserId: user?.id,
      });

      showNotification('success', `PDF Note "${uploadFormData.title}" uploaded successfully!`);
      setUploadModalOpen(false);
      setUploadFormData({
        programmeId: '',
        semesterId: '',
        subjectId: '',
        moduleId: '',
        title: '',
        description: '',
        file: null,
        isPublished: true,
      });
      refreshAllData();
    } catch (err) {
      showNotification('error', err.message || 'PDF upload failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePublish = async (note) => {
    setActionLoading(true);
    try {
      await adminService.updateNote(note.id, {
        is_published: !note.is_published,
      });
      showNotification('success', `Note is now ${!note.is_published ? 'Published' : 'Draft'}.`);
      refreshAllData();
    } catch {
      showNotification('error', 'Could not update publication state.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNote = async (note) => {
    if (!window.confirm(`Are you sure you want to permanently delete note "${note.title}"? This will delete the file from private storage.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await adminService.deleteNote(note.id, note.storage_path);
      showNotification('success', 'Note deleted successfully.');
      refreshAllData();
    } catch (err) {
      showNotification('error', err.message || 'Could not delete note.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectFormData.programmeSemesterId || !subjectFormData.name.trim()) {
      showNotification('error', 'Semester and Subject Name are required.');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.createSubject({
        programme_semester_id: subjectFormData.programmeSemesterId,
        code: subjectFormData.code.trim().toUpperCase() || null,
        name: subjectFormData.name.trim(),
        credits: Number(subjectFormData.credits) || 3,
        description: subjectFormData.description.trim() || null,
        is_active: true,
      });

      showNotification('success', `Subject "${subjectFormData.name}" added successfully.`);
      setSubjectModalOpen(false);
      setSubjectFormData({
        programmeSemesterId: '',
        code: '',
        name: '',
        credits: 3,
        description: '',
      });
      refreshAllData();
    } catch (err) {
      showNotification('error', err.message || 'Could not create subject.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!moduleFormData.subjectId || !moduleFormData.title.trim()) {
      showNotification('error', 'Subject and Module Title are required.');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.createModule({
        subject_id: moduleFormData.subjectId,
        module_number: Number(moduleFormData.moduleNumber),
        title: moduleFormData.title.trim(),
        description: moduleFormData.description.trim() || null,
        is_active: true,
      });

      showNotification('success', `Module ${moduleFormData.moduleNumber} added successfully.`);
      setModuleModalOpen(false);
      setModuleFormData({
        subjectId: '',
        moduleNumber: 1,
        title: '',
        description: '',
      });
      refreshAllData();
    } catch (err) {
      showNotification('error', err.message || 'Could not create module.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    if (!schemeFormData.id.trim() || !schemeFormData.name.trim()) {
      showNotification('error', 'Scheme ID and Name are required.');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.createScheme({
        id: schemeFormData.id.trim().toLowerCase(),
        name: schemeFormData.name.trim(),
        year: Number(schemeFormData.year) || null,
        description: schemeFormData.description.trim() || null,
        is_active: true,
      });

      showNotification('success', `Scheme "${schemeFormData.name}" added successfully.`);
      setSchemeModalOpen(false);
      setSchemeFormData({ id: '', name: '', year: new Date().getFullYear(), description: '' });
      refreshAllData();
    } catch (err) {
      showNotification('error', err.message || 'Could not create scheme.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchFormData.id.trim() || !batchFormData.programmeId || !batchFormData.name.trim()) {
      showNotification('error', 'Batch ID, Programme, and Name are required.');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.createBatch({
        id: batchFormData.id.trim().toLowerCase(),
        programme_id: batchFormData.programmeId,
        scheme_id: batchFormData.schemeId || null,
        name: batchFormData.name.trim(),
        academic_year: batchFormData.academicYear.trim() || null,
        start_year: Number(batchFormData.startYear) || null,
        end_year: Number(batchFormData.endYear) || null,
        is_active: true,
      });

      showNotification('success', `Academic Batch "${batchFormData.name}" added successfully.`);
      setBatchModalOpen(false);
      setBatchFormData({
        id: '',
        programmeId: '',
        schemeId: '',
        name: '',
        academicYear: '2024-2025',
        startYear: 2024,
        endYear: 2028,
      });
      refreshAllData();
    } catch (err) {
      showNotification('error', err.message || 'Could not create academic batch.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered notes for management
  const filteredNotes = notes.filter((n) => {
    if (noteStatusFilter === 'published' && !n.is_published) return false;
    if (noteStatusFilter === 'draft' && n.is_published) return false;
    if (!notesSearch.trim()) return true;
    const term = notesSearch.toLowerCase();
    return (
      n.title.toLowerCase().includes(term) ||
      (n.description && n.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-[#F8F5ED] text-[#303846]">
      
      {/* Top Admin Navigation Header */}
      <header className="bg-white border-b border-[#DCE5EF] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Brand Logo & Portal Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#243B53] flex items-center justify-center text-white shadow-xs">
                <Shield className="w-5 h-5 text-[#B49A70]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-lg text-[#243B53] tracking-tight">
                    KMCT Notes Hub
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#B49A70] text-white text-[10px] font-heading font-bold uppercase tracking-wider">
                    {adminProfile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
                <span className="text-[11px] text-[#475569]">
                  {adminProfile?.email || user?.email}
                </span>
              </div>
            </div>

            {/* Quick Actions & Header Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onExit}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-semibold text-[#243B53] bg-[#EAF0F6] hover:bg-[#DCE5EF] border border-[#DCE5EF] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit to Public Site</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>

          </div>
        </div>

        {/* Tab Strip */}
        <div className="border-t border-[#DCE5EF] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 text-xs font-heading font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-3 relative cursor-pointer ${
                activeTab === 'overview'
                  ? 'text-[#243B53]'
                  : 'text-[#475569] hover:text-[#243B53]'
              }`}
            >
              Overview & Analytics
              {activeTab === 'overview' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B49A70]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`py-3 relative cursor-pointer ${
                activeTab === 'notes'
                  ? 'text-[#243B53]'
                  : 'text-[#475569] hover:text-[#243B53]'
              }`}
            >
              Notes Management
              {activeTab === 'notes' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B49A70]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hierarchy')}
              className={`py-3 relative cursor-pointer ${
                activeTab === 'hierarchy'
                  ? 'text-[#243B53]'
                  : 'text-[#475569] hover:text-[#243B53]'
              }`}
            >
              Academic Structure (Schemes, Batches, Subjects)
              {activeTab === 'hierarchy' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B49A70]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Floating Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs font-sans shadow-sm ${
                notification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Top Welcome Card */}
            <div className="bg-white rounded-3xl border border-[#DCE5EF] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-heading font-semibold uppercase tracking-wider text-[#B49A70] block mb-1">
                  System Status: Active & Operational
                </span>
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#243B53]">
                  Academic Management Portal
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] mt-1 max-w-xl">
                  Manage the college curriculum, configure new academic batches, add verified subjects, and publish PDF lecture notes for enrolled students.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#243B53] hover:bg-[#1A2B3C] text-white font-heading font-semibold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <FileUp className="w-4 h-4 text-[#B49A70]" />
                  <span>Upload PDF Note</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-[#EAF0F6] text-[#243B53] font-heading font-semibold text-xs border border-[#DCE5EF] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#B49A70]" />
                  <span>Add Subject</span>
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs">
                <span className="text-xs text-[#475569] font-medium block">Programmes</span>
                <span className="font-heading font-bold text-2xl text-[#243B53] mt-1 block">
                  {metrics?.programmesCount ?? 7}
                </span>
                <span className="text-[11px] text-[#B49A70] font-semibold mt-1 block">
                  College Scope
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs">
                <span className="text-xs text-[#475569] font-medium block">Active Semesters</span>
                <span className="font-heading font-bold text-2xl text-[#243B53] mt-1 block">
                  {metrics?.semestersCount ?? 11}
                </span>
                <span className="text-[11px] text-[#475569] mt-1 block">
                  Active Batches
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs">
                <span className="text-xs text-[#475569] font-medium block">Subjects Added</span>
                <span className="font-heading font-bold text-2xl text-[#243B53] mt-1 block">
                  {metrics?.subjectsCount ?? subjects.length}
                </span>
                <span className="text-[11px] text-[#475569] mt-1 block">
                  Database Verified
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs">
                <span className="text-xs text-[#475569] font-medium block">Modules Configured</span>
                <span className="font-heading font-bold text-2xl text-[#243B53] mt-1 block">
                  {metrics?.modulesCount ?? modules.length}
                </span>
                <span className="text-[11px] text-[#475569] mt-1 block">
                  Modules 1 to 6
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs">
                <span className="text-xs text-[#475569] font-medium block">Published Notes</span>
                <span className="font-heading font-bold text-2xl text-emerald-700 mt-1 block">
                  {metrics?.publishedNotesCount ?? 0}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                  Live for Students
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs">
                <span className="text-xs text-[#475569] font-medium block">Total Downloads</span>
                <span className="font-heading font-bold text-2xl text-[#243B53] mt-1 block">
                  {metrics?.totalDownloads ?? 0}
                </span>
                <span className="text-[11px] text-[#475569] mt-1 block">
                  Student Accesses
                </span>
              </div>

            </div>

            {/* Approved Programme Order Reference Card */}
            <div className="bg-white rounded-2xl border border-[#DCE5EF] p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#243B53]">
                    Approved Academic Programmes Order
                  </h3>
                  <p className="text-xs text-[#475569]">
                    Strict sequence applied across public cards, notes explorer, and database seed.
                  </p>
                </div>
                <span className="text-xs font-heading font-semibold text-[#B49A70] bg-[#EAF0F6] px-3 py-1 rounded-full border border-[#DCE5EF]">
                  All 4 B.Tech Programmes Grouped
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {programmes.map((p, idx) => (
                  <div key={p.id} className="p-3 rounded-xl border border-[#DCE5EF] bg-[#F8F5ED]/40 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#243B53] text-white text-[11px] font-heading font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="font-heading font-bold text-xs text-[#243B53] block truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[#475569]">
                        {p.degree_type} • Sort #{p.sort_order}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: NOTES MANAGEMENT */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            
            {/* Actions Bar */}
            <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={notesSearch}
                    onChange={(e) => setNotesSearch(e.target.value)}
                    placeholder="Search notes by title..."
                    className="pl-9 pr-4 py-2 bg-[#F8F5ED]/60 border border-[#DCE5EF] rounded-xl text-xs font-sans placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#B49A70]/50"
                  />
                </div>

                <div className="flex items-center gap-1 bg-[#F0F2F5] p-1 rounded-xl border border-[#DCE5EF]">
                  <button
                    type="button"
                    onClick={() => setNoteStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-colors cursor-pointer ${
                      noteStatusFilter === 'all' ? 'bg-white text-[#243B53] shadow-xs' : 'text-[#475569]'
                    }`}
                  >
                    All ({notes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteStatusFilter('published')}
                    className={`px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-colors cursor-pointer ${
                      noteStatusFilter === 'published' ? 'bg-white text-emerald-700 shadow-xs' : 'text-[#475569]'
                    }`}
                  >
                    Published ({notes.filter((n) => n.is_published).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteStatusFilter('draft')}
                    className={`px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-colors cursor-pointer ${
                      noteStatusFilter === 'draft' ? 'bg-white text-amber-700 shadow-xs' : 'text-[#475569]'
                    }`}
                  >
                    Drafts ({notes.filter((n) => !n.is_published).length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={refreshAllData}
                  className="p-2.5 rounded-xl border border-[#DCE5EF] text-[#475569] hover:text-[#243B53] hover:bg-[#F0F2F5] transition-colors cursor-pointer"
                  title="Refresh list"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#243B53] hover:bg-[#1A2B3C] text-white font-heading font-semibold text-xs transition-all shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#B49A70]" />
                  <span>Upload Note PDF</span>
                </button>
              </div>

            </div>

            {/* Notes Table */}
            <div className="bg-white rounded-2xl border border-[#DCE5EF] shadow-2xs overflow-hidden">
              {filteredNotes.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-10 h-10 text-[#475569]/40 mx-auto mb-2" />
                  <h4 className="font-heading font-bold text-base text-[#243B53]">No Notes Found</h4>
                  <p className="text-xs text-[#475569] max-w-sm mx-auto mt-1 mb-4">
                    {notes.length === 0
                      ? 'No notes have been uploaded to the database yet. Click "Upload Note PDF" to publish your first academic material.'
                      : 'No notes match your current search or filter criteria.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#243B53] text-white font-heading font-semibold text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload First Note</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#F8F5ED] text-[#243B53] font-heading font-bold border-b border-[#DCE5EF]">
                      <tr>
                        <th className="py-3 px-4">Note Title</th>
                        <th className="py-3 px-4">Subject & Module</th>
                        <th className="py-3 px-4">File Specs</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Downloads</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5EF]">
                      {filteredNotes.map((note) => {
                        const moduleObj = note.modules;
                        const subjectObj = moduleObj?.subjects;
                        const semesterObj = subjectObj?.programme_semesters;
                        const programmeObj = semesterObj?.programmes;

                        return (
                          <tr key={note.id} className="hover:bg-[#F8F5ED]/40 transition-colors">
                            
                            <td className="py-3.5 px-4">
                              <span className="font-heading font-bold text-sm text-[#243B53] block">
                                {note.title}
                              </span>
                              {note.description && (
                                <span className="text-[11px] text-[#475569] line-clamp-1">
                                  {note.description}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-[#243B53] block truncate max-w-xs">
                                {subjectObj?.name || 'Subject'}
                              </span>
                              <span className="text-[11px] text-[#475569]">
                                {programmeObj?.name || ''} {semesterObj?.title || ''} • Module {moduleObj?.module_number || 1}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-medium text-[#243B53] block">
                                {note.file_size_bytes ? `${(note.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : 'PDF'}
                              </span>
                              <span className="text-[10px] text-[#475569] uppercase font-mono">
                                PDF Document
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(note)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-heading font-semibold cursor-pointer ${
                                  note.is_published
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${note.is_published ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                                <span>{note.is_published ? 'Published' : 'Draft'}</span>
                              </button>
                            </td>

                            <td className="py-3.5 px-4 text-[#475569]">
                              <span className="font-semibold text-[#243B53]">
                                {note.download_count || 0}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => academicService.previewNote(note)}
                                  className="p-1.5 rounded-lg border border-[#DCE5EF] text-[#475569] hover:text-[#243B53] hover:bg-[#F0F2F5] transition-colors cursor-pointer"
                                  title="View PDF"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note)}
                                  className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete Note"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: ACADEMIC STRUCTURE MANAGEMENT */}
        {activeTab === 'hierarchy' && (
          <div className="space-y-8">
            
            {/* Quick Structure Action Bar */}
            <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-[#243B53]">
                  Curriculum Hierarchy Control
                </h3>
                <p className="text-xs text-[#475569]">
                  Add verified subjects, modules, batches, and schemes dynamically through Supabase.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#243B53] text-white text-xs font-heading font-semibold hover:bg-[#1A2B3C] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#B49A70]" />
                  <span>Add Subject</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModuleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE5EF] text-[#243B53] text-xs font-heading font-semibold hover:bg-[#F0F2F5] cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-[#B49A70]" />
                  <span>Add Module</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE5EF] text-[#243B53] text-xs font-heading font-semibold hover:bg-[#F0F2F5] cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-[#B49A70]" />
                  <span>Add Batch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSchemeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE5EF] text-[#243B53] text-xs font-heading font-semibold hover:bg-[#F0F2F5] cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5 text-[#B49A70]" />
                  <span>Add Scheme</span>
                </button>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="bg-white rounded-2xl border border-[#DCE5EF] shadow-2xs p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-heading font-bold text-base text-[#243B53]">
                    Active Course Subjects ({subjects.length})
                  </h4>
                  <p className="text-xs text-[#475569]">
                    Subjects linked to specific programme semesters.
                  </p>
                </div>
              </div>

              {subjects.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#DCE5EF] rounded-xl">
                  <BookOpen className="w-8 h-8 text-[#475569]/40 mx-auto mb-2" />
                  <p className="text-xs text-[#475569] mb-3">No subjects created in database yet.</p>
                  <button
                    type="button"
                    onClick={() => setSubjectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#243B53] text-white text-xs font-heading font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Subject</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#DCE5EF]">
                  {subjects.map((sub) => (
                    <div key={sub.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {sub.code && (
                            <span className="px-2 py-0.5 rounded bg-[#EAF0F6] text-[10px] font-heading font-bold text-[#243B53]">
                              {sub.code}
                            </span>
                          )}
                          <span className="font-heading font-bold text-sm text-[#243B53]">
                            {sub.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#475569]">
                          {sub.programme_semesters?.programmes?.name || ''} — {sub.programme_semesters?.title || ''} • {sub.credits || 3} Credits
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#475569]">
                          {(sub.modules || []).length} Modules
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schemes and Batches Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Schemes */}
              <div className="bg-white rounded-2xl border border-[#DCE5EF] shadow-2xs p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading font-bold text-base text-[#243B53]">
                    Curriculum Schemes ({schemes.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSchemeModalOpen(true)}
                    className="text-xs font-heading font-semibold text-[#B49A70] hover:underline cursor-pointer"
                  >
                    + Add Scheme
                  </button>
                </div>

                {schemes.length === 0 ? (
                  <p className="text-xs text-[#475569] p-4 text-center border border-dashed border-[#DCE5EF] rounded-xl">
                    No curriculum schemes configured yet. Add verified schemes to map to programmes.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {schemes.map((sc) => (
                      <div key={sc.id} className="p-3 rounded-xl bg-[#F8F5ED]/50 border border-[#DCE5EF] flex items-center justify-between">
                        <div>
                          <span className="font-heading font-bold text-xs text-[#243B53] block">
                            {sc.name}
                          </span>
                          <span className="text-[10px] text-[#475569]">
                            Year {sc.year || 'N/A'} • ID: {sc.id}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Batches */}
              <div className="bg-white rounded-2xl border border-[#DCE5EF] shadow-2xs p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading font-bold text-base text-[#243B53]">
                    Academic Batches ({batches.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setBatchModalOpen(true)}
                    className="text-xs font-heading font-semibold text-[#B49A70] hover:underline cursor-pointer"
                  >
                    + Add Batch
                  </button>
                </div>

                {batches.length === 0 ? (
                  <p className="text-xs text-[#475569] p-4 text-center border border-dashed border-[#DCE5EF] rounded-xl">
                    No academic batches created yet. Add verified student batches as programmes progress.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {batches.map((b) => (
                      <div key={b.id} className="p-3 rounded-xl bg-[#F8F5ED]/50 border border-[#DCE5EF] flex items-center justify-between">
                        <div>
                          <span className="font-heading font-bold text-xs text-[#243B53] block">
                            {b.name}
                          </span>
                          <span className="text-[10px] text-[#475569]">
                            {b.programmes?.name || b.programme_id} • {b.start_year}-{b.end_year}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ===================================================================== */}
      {/* MODAL 1: UPLOAD PDF NOTE */}
      {/* ===================================================================== */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#243B53]/50 backdrop-blur-xs" onClick={() => setUploadModalOpen(false)} />
          
          <div className="relative w-full max-w-xl bg-white rounded-3xl border border-[#DCE5EF] shadow-2xl p-6 sm:p-8 z-10 my-8">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#DCE5EF]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#243B53] flex items-center justify-center text-white">
                  <Upload className="w-5 h-5 text-[#B49A70]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#243B53]">Upload Academic Note PDF</h3>
                  <p className="text-xs text-[#475569]">File is stored in secure private storage bucket (max 50 MB, PDF only)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="text-[#475569] hover:text-[#243B53] p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              
              {/* Select Programme */}
              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  1. Academic Programme
                </label>
                <select
                  required
                  value={uploadFormData.programmeId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const sem = semesters.find((s) => s.programme_id === pid);
                    setUploadFormData({
                      ...uploadFormData,
                      programmeId: pid,
                      semesterId: sem?.id || '',
                      subjectId: '',
                      moduleId: '',
                    });
                  }}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B49A70]/50"
                >
                  <option value="">-- Choose Programme --</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.degree_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Semester */}
              {uploadFormData.programmeId && (
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                    2. Active Semester
                  </label>
                  <select
                    required
                    value={uploadFormData.semesterId}
                    onChange={(e) => {
                      setUploadFormData({
                        ...uploadFormData,
                        semesterId: e.target.value,
                        subjectId: '',
                        moduleId: '',
                      });
                    }}
                    className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B49A70]/50"
                  >
                    <option value="">-- Choose Semester --</option>
                    {semesters
                      .filter((s) => s.programme_id === uploadFormData.programmeId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.phase || 'Coursework'})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Select Subject */}
              {uploadFormData.semesterId && (
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                    3. Course Subject
                  </label>
                  <select
                    required
                    value={uploadFormData.subjectId}
                    onChange={(e) => {
                      setUploadFormData({
                        ...uploadFormData,
                        subjectId: e.target.value,
                        moduleId: '',
                      });
                    }}
                    className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B49A70]/50"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects
                      .filter((sub) => sub.programme_semester_id === uploadFormData.semesterId)
                      .map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.code ? `${sub.code} — ` : ''}{sub.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Select Module */}
              {uploadFormData.subjectId && (
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                    4. Subject Module (1 to 6)
                  </label>
                  <select
                    required
                    value={uploadFormData.moduleId}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, moduleId: e.target.value })}
                    className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B49A70]/50"
                  >
                    <option value="">-- Choose Module --</option>
                    {modules
                      .filter((m) => m.subject_id === uploadFormData.subjectId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          Module {m.module_number}: {m.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Note Title */}
              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Module 1 Lecture Notes & Problems"
                  value={uploadFormData.title}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B49A70]/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Description / Topic Coverage (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief note summary, chapters covered, or exam revision tips..."
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B49A70]/50"
                />
              </div>

              {/* File Picker */}
              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Select PDF File (Max 50MB)
                </label>
                <input
                  type="file"
                  required
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.type !== 'application/pdf') {
                      alert('Only PDF files are supported.');
                      e.target.value = '';
                      return;
                    }
                    if (f && f.size > 52428800) {
                      alert('File exceeds 50 MB limit.');
                      e.target.value = '';
                      return;
                    }
                    setUploadFormData({ ...uploadFormData, file: f || null });
                  }}
                  className="w-full p-2 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs text-[#303846] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#243B53] file:text-white file:font-heading file:font-semibold file:text-xs cursor-pointer"
                />
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="publishImmediately"
                  checked={uploadFormData.isPublished}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded text-[#243B53] focus:ring-[#B49A70]"
                />
                <label htmlFor="publishImmediately" className="text-xs font-heading font-semibold text-[#243B53] cursor-pointer">
                  Publish immediately for student viewing & downloads
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE5EF]">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#DCE5EF] text-xs font-heading font-semibold text-[#475569] hover:bg-[#F0F2F5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#243B53] hover:bg-[#1A2B3C] text-white text-xs font-heading font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading to Storage...</span>
                    </>
                  ) : (
                    <span>Confirm & Upload Note</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: ADD SUBJECT */}
      {/* ===================================================================== */}
      {subjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#243B53]/50 backdrop-blur-xs" onClick={() => setSubjectModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#DCE5EF] shadow-2xl p-6 sm:p-8 z-10 my-8">
            <h3 className="font-heading font-bold text-lg text-[#243B53] mb-4 pb-2 border-b border-[#DCE5EF]">
              Add Course Subject
            </h3>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Target Programme Semester
                </label>
                <select
                  required
                  value={subjectFormData.programmeSemesterId}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, programmeSemesterId: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                >
                  <option value="">-- Choose Programme Semester --</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.programmes?.name} — {s.title} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Course Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering Mathematics I"
                  value={subjectFormData.name}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MAT101"
                    value={subjectFormData.code}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                    className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={subjectFormData.credits}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, credits: e.target.value })}
                    className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Course objectives, curriculum overview..."
                  value={subjectFormData.description}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, description: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE5EF]">
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE5EF] text-xs font-heading font-semibold text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#243B53] text-white text-xs font-heading font-semibold"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: ADD MODULE */}
      {/* ===================================================================== */}
      {moduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#243B53]/50 backdrop-blur-xs" onClick={() => setModuleModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#DCE5EF] shadow-2xl p-6 sm:p-8 z-10 my-8">
            <h3 className="font-heading font-bold text-lg text-[#243B53] mb-4 pb-2 border-b border-[#DCE5EF]">
              Add Subject Module
            </h3>

            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Target Subject
                </label>
                <select
                  required
                  value={moduleFormData.subjectId}
                  onChange={(e) => setModuleFormData({ ...moduleFormData, subjectId: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code ? `${sub.code} - ` : ''}{sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Module Number (1 to 6)
                </label>
                <select
                  value={moduleFormData.moduleNumber}
                  onChange={(e) => setModuleFormData({ ...moduleFormData, moduleNumber: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      Module {num}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Module Title / Theme
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Differential Calculus & Curvature"
                  value={moduleFormData.title}
                  onChange={(e) => setModuleFormData({ ...moduleFormData, title: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Module Summary (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Syllabus topics covered in this module..."
                  value={moduleFormData.description}
                  onChange={(e) => setModuleFormData({ ...moduleFormData, description: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE5EF]">
                <button
                  type="button"
                  onClick={() => setModuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE5EF] text-xs font-heading font-semibold text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#243B53] text-white text-xs font-heading font-semibold"
                >
                  Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: ADD SCHEME */}
      {/* ===================================================================== */}
      {schemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#243B53]/50 backdrop-blur-xs" onClick={() => setSchemeModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#DCE5EF] shadow-2xl p-6 sm:p-8 z-10 my-8">
            <h3 className="font-heading font-bold text-lg text-[#243B53] mb-4 pb-2 border-b border-[#DCE5EF]">
              Add Curriculum Scheme
            </h3>

            <form onSubmit={handleCreateScheme} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Scheme ID (Unique Identifier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ktu-2024"
                  value={schemeFormData.id}
                  onChange={(e) => setSchemeFormData({ ...schemeFormData, id: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Scheme Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KTU 2024 Scheme"
                  value={schemeFormData.name}
                  onChange={(e) => setSchemeFormData({ ...schemeFormData, name: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Regulations Year
                </label>
                <input
                  type="number"
                  value={schemeFormData.year}
                  onChange={(e) => setSchemeFormData({ ...schemeFormData, year: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE5EF]">
                <button
                  type="button"
                  onClick={() => setSchemeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE5EF] text-xs font-heading font-semibold text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#243B53] text-white text-xs font-heading font-semibold"
                >
                  Create Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: ADD BATCH */}
      {/* ===================================================================== */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#243B53]/50 backdrop-blur-xs" onClick={() => setBatchModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#DCE5EF] shadow-2xl p-6 sm:p-8 z-10 my-8">
            <h3 className="font-heading font-bold text-lg text-[#243B53] mb-4 pb-2 border-b border-[#DCE5EF]">
              Add Academic Batch
            </h3>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Batch ID (Unique Identifier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. batch-aids-2024"
                  value={batchFormData.id}
                  onChange={(e) => setBatchFormData({ ...batchFormData, id: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Target Programme
                </label>
                <select
                  required
                  value={batchFormData.programmeId}
                  onChange={(e) => setBatchFormData({ ...batchFormData, programmeId: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                >
                  <option value="">-- Choose Programme --</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                  Batch Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024 - 2028 Batch"
                  value={batchFormData.name}
                  onChange={(e) => setBatchFormData({ ...batchFormData, name: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                    Start Year
                  </label>
                  <input
                    type="number"
                    value={batchFormData.startYear}
                    onChange={(e) => setBatchFormData({ ...batchFormData, startYear: e.target.value })}
                    className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1">
                    End Year
                  </label>
                  <input
                    type="number"
                    value={batchFormData.endYear}
                    onChange={(e) => setBatchFormData({ ...batchFormData, endYear: e.target.value })}
                    className="w-full p-2.5 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE5EF]">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE5EF] text-xs font-heading font-semibold text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#243B53] text-white text-xs font-heading font-semibold"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
