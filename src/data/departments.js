import { INITIAL_PROGRAMMES } from './academicStructure';

/**
 * College Courses / Programmes List
 * Exactly 7 active programmes.
 */
export const departments = INITIAL_PROGRAMMES.map((prog) => ({
  id: prog.id,
  code: prog.code,
  name: prog.name,
  fullName: prog.fullName,
  degreeType: prog.degreeType,
  scheme: prog.scheme,
  description: prog.description,
  iconName: prog.iconName,
  status: prog.scheme,
  semesterCount: prog.availableSemesters.length,
  modulesCount: `${prog.availableSemesters.length} Semester${prog.availableSemesters.length > 1 ? 's' : ''} Available`,
  availableSemesters: prog.availableSemesters,
}));
