import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_PROGRAMMES } from '../data/academicStructure';

/**
 * Academic Service Layer for KMCT Notes Hub
 * 
 * Provides high-level abstractions for fetching academic hierarchy
 * (Programmes -> Schemes -> Batches -> Semesters -> Subjects -> Modules -> Notes)
 * and managing secure PDF downloads from the private Supabase storage bucket.
 * 
 * Falls back safely to verified college data if database is empty or offline.
 */

export const academicService = {
  /**
   * Fetch all active programmes in strict sort order.
   */
  async getProgrammes() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('programmes')
          .select(`
            id,
            code,
            name,
            full_name,
            degree_type,
            description,
            icon_name,
            is_active,
            sort_order,
            programme_schemes (
              id,
              is_current,
              schemes (
                id,
                name,
                year
              )
            ),
            programme_semesters (
              id,
              batch_id,
              scheme_id,
              semester_number,
              title,
              phase,
              focus,
              description,
              is_active,
              sort_order
            )
          `)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((prog) => {
            const currentSchemeObj = (prog.programme_schemes || []).find((ps) => ps.is_current);
            return {
              id: prog.id,
              code: prog.code,
              name: prog.name,
              fullName: prog.full_name,
              degreeType: prog.degree_type,
              scheme: currentSchemeObj?.schemes?.name || (prog.degree_type === 'B.Tech' ? 'KTU 2024 Scheme' : 'KTU Scheme'),
              schemeObj: currentSchemeObj?.schemes || null,
              iconName: prog.icon_name,
              description: prog.description,
              sortOrder: prog.sort_order,
              isActive: prog.is_active,
              availableSemesters: (prog.programme_semesters || [])
                .filter((s) => s.is_active)
                .sort((a, b) => a.semester_number - b.semester_number)
                .map((sem) => ({
                  id: sem.id,
                  programmeId: prog.id,
                  batchId: sem.batch_id,
                  schemeId: sem.scheme_id,
                  semesterNumber: sem.semester_number,
                  title: sem.title,
                  phase: sem.phase || 'College Coursework',
                  focus: sem.focus || '',
                  description: sem.description || '',
                  isActive: sem.is_active,
                  sortOrder: sem.sort_order,
                })),
            };
          });
        }
      } catch (err) {
        console.warn('[KMCT Notes Hub] Could not query Supabase programmes, using local fallback:', err);
      }
    }

    // Default to verified initial college programmes (sorted by sortOrder 1-7)
    return INITIAL_PROGRAMMES.filter((p) => p.isActive);
  },

  /**
   * Get available semesters for a specific programme.
   */
  async getSemestersByProgramme(programmeId) {
    const programmes = await this.getProgrammes();
    const programme = programmes.find((p) => p.id === programmeId) || programmes[0];
    return programme ? programme.availableSemesters : [];
  },

  /**
   * Get a specific programme by ID.
   */
  async getProgrammeById(programmeId) {
    const programmes = await this.getProgrammes();
    return programmes.find((p) => p.id === programmeId) || programmes[0] || null;
  },

  /**
   * Fetch active subjects for a specific programme semester.
   */
  async getSubjects(programmeSemesterId) {
    if (!programmeSemesterId) return [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select(`
            id,
            programme_semester_id,
            code,
            name,
            credits,
            description,
            is_active,
            created_at,
            modules (
              id,
              module_number,
              title,
              is_active
            )
          `)
          .eq('programme_semester_id', programmeSemesterId)
          .eq('is_active', true)
          .order('code', { ascending: true, nullsFirst: false });

        if (!error && data) {
          return data.map((sub) => ({
            ...sub,
            activeModuleCount: (sub.modules || []).filter((m) => m.is_active).length,
          }));
        }
      } catch (err) {
        console.warn('[KMCT Notes Hub] Error fetching subjects:', err);
      }
    }

    return [];
  },

  /**
   * Fetch active modules for a specific subject.
   */
  async getModules(subjectId) {
    if (!subjectId) return [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('modules')
          .select(`
            id,
            subject_id,
            module_number,
            title,
            description,
            is_active,
            notes (
              id,
              is_published
            )
          `)
          .eq('subject_id', subjectId)
          .eq('is_active', true)
          .order('module_number', { ascending: true });

        if (!error && data) {
          return data.map((mod) => ({
            ...mod,
            publishedNotesCount: (mod.notes || []).filter((n) => n.is_published).length,
          }));
        }
      } catch (err) {
        console.warn('[KMCT Notes Hub] Error fetching modules:', err);
      }
    }

    return [];
  },

  /**
   * Fetch published notes for a specific module (public students).
   */
  async getPublishedNotes(moduleId) {
    if (!moduleId) return [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select(`
            id,
            module_id,
            title,
            description,
            storage_path,
            file_url,
            file_size_bytes,
            file_type,
            is_published,
            download_count,
            created_at
          `)
          .eq('module_id', moduleId)
          .eq('is_published', true)
          .eq('file_type', 'application/pdf')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('[KMCT Notes Hub] Error fetching notes:', err);
      }
    }

    return [];
  },

  /**
   * Download a published note PDF from the private Supabase Storage bucket.
   * Leverages RLS-authenticated streaming for anon users and triggers native browser download.
   */
  async downloadNote(note) {
    if (!note || !note.storage_path) {
      throw new Error('Invalid note record: missing storage path');
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    // 1. Download blob from private bucket via Supabase Storage
    const { data: blob, error } = await supabase.storage
      .from('academic-notes')
      .download(note.storage_path);

    if (error) {
      console.error('[KMCT Notes Hub] Storage download error:', error);
      throw new Error(error.message || 'Failed to download file from secure storage.');
    }

    // 2. Increment download count in background (non-blocking)
    this.incrementDownloadCount(note.id).catch(() => {});

    // 3. Create blob URL and trigger browser download
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    
    // Clean file name
    const cleanFileName = (note.title || 'KMCT-Note')
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    link.download = `${cleanFileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke URL after small delay
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);

    return { success: true };
  },

  /**
   * Open published note PDF in browser tab for viewing.
   */
  async previewNote(note) {
    if (!note || !note.storage_path) {
      throw new Error('Invalid note record: missing storage path');
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data: blob, error } = await supabase.storage
      .from('academic-notes')
      .download(note.storage_path);

    if (error) {
      console.error('[KMCT Notes Hub] Storage preview error:', error);
      throw new Error(error.message || 'Failed to preview file from secure storage.');
    }

    this.incrementDownloadCount(note.id).catch(() => {});

    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    
    // Revoke URL after a longer timeout so browser viewer can render
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 60000);

    return { success: true };
  },

  /**
   * Increment download count for a note.
   */
  async incrementDownloadCount(noteId) {
    if (!isSupabaseConfigured || !supabase || !noteId) return;

    try {
      const { data } = await supabase
        .from('notes')
        .select('download_count')
        .eq('id', noteId)
        .maybeSingle();

      if (data) {
        await supabase
          .from('notes')
          .update({ download_count: (data.download_count || 0) + 1 })
          .eq('id', noteId);
      }
    } catch (err) {
      // Non-critical telemetry error
      console.debug('[KMCT Notes Hub] Telemetry notice:', err);
    }
  },

  /**
   * Overall platform statistics.
   */
  async getStats() {
    const programmes = await this.getProgrammes();
    const totalSemesters = programmes.reduce(
      (acc, curr) => acc + (curr.availableSemesters?.length || 0),
      0
    );

    let totalSubjects = 0;
    let totalNotes = 0;

    if (isSupabaseConfigured && supabase) {
      try {
        const [{ count: subCount }, { count: noteCount }] = await Promise.all([
          supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('notes').select('*', { count: 'exact', head: true }).eq('is_published', true),
        ]);
        totalSubjects = subCount || 0;
        totalNotes = noteCount || 0;
      } catch (err) {
        console.debug('Stats fetch fallback:', err);
      }
    }

    return {
      programmeCount: programmes.length, // 7
      semesterCombinationCount: totalSemesters, // 11
      subjectCount: totalSubjects,
      publishedNotesCount: totalNotes,
    };
  },
};
