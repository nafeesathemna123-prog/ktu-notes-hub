import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Admin Service Layer for KMCT Notes Hub
 * 
 * Handles authenticated administrative actions:
 * - Admin profile & role verification
 * - Academic structure CRUD (Programmes, Schemes, Batches, Semesters, Subjects, Modules)
 * - Notes PDF upload, publishing, draft toggle, and deletion
 * - Private storage file management
 */

export const adminService = {
  /**
   * Verify whether the authenticated user has an admin profile in public.admin_profiles.
   */
  async verifyAdminAccess(userId) {
    if (!isSupabaseConfigured || !supabase || !userId) {
      return { isAdmin: false, profile: null };
    }

    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('id, email, full_name, role')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return { isAdmin: false, profile: null };
      }

      const isAdmin = data.role === 'admin' || data.role === 'super_admin';
      return { isAdmin, profile: data };
    } catch (err) {
      console.error('[KMCT Notes Hub] Admin verification error:', err);
      return { isAdmin: false, profile: null };
    }
  },

  /**
   * Fetch comprehensive dashboard analytics from real database tables.
   */
  async getDashboardMetrics() {
    if (!isSupabaseConfigured || !supabase) {
      return {
        programmesCount: 7,
        semestersCount: 11,
        subjectsCount: 0,
        modulesCount: 0,
        publishedNotesCount: 0,
        draftNotesCount: 0,
        totalDownloads: 0,
      };
    }

    try {
      const [
        { count: progCount },
        { count: semCount },
        { count: subCount },
        { count: modCount },
        { count: pubNoteCount },
        { count: draftNoteCount },
        { data: notesDownloads },
      ] = await Promise.all([
        supabase.from('programmes').select('*', { count: 'exact', head: true }),
        supabase.from('programme_semesters').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('modules').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('notes').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('notes').select('*', { count: 'exact', head: true }).eq('is_published', false),
        supabase.from('notes').select('download_count'),
      ]);

      const totalDownloads = (notesDownloads || []).reduce(
        (sum, item) => sum + (item.download_count || 0),
        0
      );

      return {
        programmesCount: progCount || 7,
        semestersCount: semCount || 11,
        subjectsCount: subCount || 0,
        modulesCount: modCount || 0,
        publishedNotesCount: pubNoteCount || 0,
        draftNotesCount: draftNoteCount || 0,
        totalDownloads,
      };
    } catch (err) {
      console.error('[KMCT Notes Hub] Dashboard metrics fetch error:', err);
      return {
        programmesCount: 7,
        semestersCount: 11,
        subjectsCount: 0,
        modulesCount: 0,
        publishedNotesCount: 0,
        draftNotesCount: 0,
        totalDownloads: 0,
      };
    }
  },

  // ---------------------------------------------------------------------------
  // 1. PROGRAMMES & SCHEMES
  // ---------------------------------------------------------------------------

  async getAllProgrammes() {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('programmes')
      .select(`
        *,
        programme_schemes (
          id,
          scheme_id,
          is_current,
          schemes (
            id,
            name,
            year
          )
        )
      `)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updateProgramme(id, updates) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('programmes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllSchemes() {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('schemes')
      .select('*')
      .order('year', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data || [];
  },

  async createScheme(schemeData) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('schemes')
      .insert(schemeData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async mapSchemeToProgramme(programmeId, schemeId, isCurrent = false) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    if (isCurrent) {
      // Clear existing current scheme for this programme
      await supabase
        .from('programme_schemes')
        .update({ is_current: false })
        .eq('programme_id', programmeId);
    }

    const { data, error } = await supabase
      .from('programme_schemes')
      .upsert({
        programme_id: programmeId,
        scheme_id: schemeId,
        is_current: isCurrent,
      }, { onConflict: 'programme_id,scheme_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ---------------------------------------------------------------------------
  // 2. ACADEMIC BATCHES & SEMESTERS
  // ---------------------------------------------------------------------------

  async getAllBatches() {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('academic_batches')
      .select(`
        *,
        programmes (
          id,
          name,
          code
        ),
        schemes (
          id,
          name
        )
      `)
      .order('start_year', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data || [];
  },

  async createBatch(batchData) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('academic_batches')
      .insert(batchData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllSemesters() {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('programme_semesters')
      .select(`
        *,
        programmes (
          id,
          name,
          code,
          sort_order
        ),
        academic_batches (
          id,
          name
        ),
        schemes (
          id,
          name
        )
      `)
      .order('programme_id')
      .order('semester_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createSemester(semesterData) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('programme_semesters')
      .insert(semesterData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSemester(id, updates) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('programme_semesters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ---------------------------------------------------------------------------
  // 3. SUBJECTS & MODULES
  // ---------------------------------------------------------------------------

  async getAllSubjects(programmeSemesterId = null) {
    if (!isSupabaseConfigured || !supabase) return [];

    let query = supabase
      .from('subjects')
      .select(`
        *,
        programme_semesters (
          id,
          semester_number,
          title,
          programmes (
            id,
            name,
            code
          )
        ),
        modules (
          id,
          module_number,
          title,
          is_active
        )
      `)
      .order('code', { ascending: true, nullsFirst: false });

    if (programmeSemesterId) {
      query = query.eq('programme_semester_id', programmeSemesterId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createSubject(subjectData) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSubject(id, updates) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllModules(subjectId = null) {
    if (!isSupabaseConfigured || !supabase) return [];

    let query = supabase
      .from('modules')
      .select(`
        *,
        subjects (
          id,
          code,
          name,
          programme_semesters (
            id,
            semester_number,
            title,
            programmes (
              id,
              name,
              code
            )
          )
        ),
        notes (
          id,
          title,
          is_published
        )
      `)
      .order('module_number', { ascending: true });

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createModule(moduleData) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('modules')
      .insert(moduleData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateModule(id, updates) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ---------------------------------------------------------------------------
  // 4. NOTES MANAGEMENT (PDF UPLOAD & CRUD)
  // ---------------------------------------------------------------------------

  async getAllNotes(filterOptions = {}) {
    if (!isSupabaseConfigured || !supabase) return [];

    let query = supabase
      .from('notes')
      .select(`
        *,
        modules (
          id,
          module_number,
          title,
          subjects (
            id,
            code,
            name,
            programme_semesters (
              id,
              semester_number,
              title,
              programmes (
                id,
                name,
                code
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (filterOptions.moduleId) {
      query = query.eq('module_id', filterOptions.moduleId);
    }
    if (filterOptions.isPublished !== undefined) {
      query = query.eq('is_published', filterOptions.isPublished);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Upload note PDF file to private Supabase storage bucket 'academic-notes'
   * and create database record in public.notes.
   */
  async uploadNote({ file, moduleId, title, description, isPublished = false, adminUserId }) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    if (!file) throw new Error('No PDF file provided.');

    // 1. Validate file type & size (50MB maximum)
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF documents (application/pdf) are permitted.');
    }

    const MAX_BYTES = 52428800; // 50 MB
    if (file.size > MAX_BYTES) {
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 50 MB limit.`);
    }

    // 2. Generate secure, unique, and predictable storage path
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .toLowerCase();
    const timestamp = Date.now();
    const storagePath = `modules/${moduleId}/${timestamp}_${sanitizedName}`;

    // 3. Upload to private bucket 'academic-notes'
    const { error: uploadError } = await supabase.storage
      .from('academic-notes')
      .upload(storagePath, file, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[KMCT Notes Hub] PDF storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 4. Insert note row into public.notes
    const { data: noteRow, error: insertError } = await supabase
      .from('notes')
      .insert({
        module_id: moduleId,
        title: title.trim(),
        description: description ? description.trim() : null,
        storage_path: storagePath,
        file_size_bytes: file.size,
        file_type: 'application/pdf',
        is_published: Boolean(isPublished),
        created_by: adminUserId || null,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback uploaded file from storage if DB insert fails to prevent orphans
      await supabase.storage.from('academic-notes').remove([storagePath]);
      throw new Error(`Database record creation failed: ${insertError.message}`);
    }

    return noteRow;
  },

  async updateNote(noteId, updates) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNote(noteId, storagePath) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    // 1. Delete from database
    const { error: dbError } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (dbError) throw dbError;

    // 2. Delete file from private storage
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('academic-notes')
        .remove([storagePath]);

      if (storageError) {
        console.warn('[KMCT Notes Hub] Notice: Could not remove storage file after DB delete:', storageError);
      }
    }

    return { success: true };
  },
};

