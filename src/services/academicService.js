import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_PROGRAMMES } from '../data/academicStructure';

/**
 * Academic Service Layer
 * 
 * Provides an abstraction for retrieving and managing programmes and semesters.
 * Uses local verified college data as the default/fallback, and seamlessly
 * queries Supabase once environment variables and database tables are connected.
 */

export const academicService = {
  /**
   * Fetch all active programmes/courses.
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
            scheme_id,
            description,
            icon_name,
            is_active,
            sort_order,
            schemes (
              id,
              name
            ),
            programme_semesters (
              id,
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
          return data.map((prog) => ({
            id: prog.id,
            code: prog.code,
            name: prog.name,
            fullName: prog.full_name,
            degreeType: prog.degree_type,
            schemeId: prog.scheme_id,
            scheme: prog.schemes?.name || (prog.scheme_id === 'univ-general' ? 'University Curriculum' : 'KTU 2024 Scheme'),
            iconName: prog.icon_name,
            description: prog.description,
            isActive: prog.is_active,
            availableSemesters: (prog.programme_semesters || [])
              .filter((s) => s.is_active)
              .sort((a, b) => a.semester_number - b.semester_number)
              .map((sem) => ({
                id: sem.id,
                semesterNumber: sem.semester_number,
                title: sem.title,
                phase: sem.phase,
                focus: sem.focus,
                description: sem.description,
                isActive: sem.is_active,
              })),
          }));
        }
      } catch (err) {
        console.warn('Could not query Supabase programmes, falling back to local data:', err);
      }
    }

    // Default to verified initial college programmes
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
   * Get overall stats for the college archive.
   */
  async getStats() {
    const programmes = await this.getProgrammes();
    const totalSemesters = programmes.reduce(
      (acc, curr) => acc + (curr.availableSemesters?.length || 0),
      0
    );

    return {
      programmeCount: programmes.length, // 7
      semesterCombinationCount: totalSemesters, // 11
    };
  },
};
