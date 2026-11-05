import { INITIAL_PROGRAMMES } from './academicStructure';

/**
 * Returns available semesters for a given programme ID.
 * Defaults to the first programme (B.Tech AI & DS) if not specified.
 */
export function getSemestersForProgramme(programmeId) {
  const programme = INITIAL_PROGRAMMES.find((p) => p.id === programmeId) || INITIAL_PROGRAMMES[0];
  return programme.availableSemesters.map((sem) => ({
    id: sem.id,
    number: sem.semesterNumber,
    title: sem.title,
    phase: sem.phase,
    focus: sem.focus,
    description: sem.description,
    iconName: sem.semesterNumber === 1 ? 'GraduationCap' : sem.semesterNumber === 2 ? 'BookOpen' : 'Binary',
    programmeId: programme.id,
    programmeName: programme.name,
    programmeScheme: programme.scheme,
  }));
}

/**
 * Default initial semesters (B.Tech AI & DS: S1, S2, S3)
 */
export const semesters = getSemestersForProgramme('btech-aids');
