import {
  GraduationCap,
  BookOpen,
  Binary,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { INITIAL_PROGRAMMES } from '../data/academicStructure';

const semesterIcons = {
  1: GraduationCap,
  2: BookOpen,
  3: Binary,
  4: Layers,
};

export function SemesterSection({
  selectedProgrammeId = 'btech-aids',
  onProgrammeChange,
  onSemesterSelect,
}) {
  const currentProgramme =
    INITIAL_PROGRAMMES.find((p) => p.id === selectedProgrammeId) ||
    INITIAL_PROGRAMMES[0];

  const availableSemesters = currentProgramme.availableSemesters || [];

  return (
    <section id="semesters" className="py-16 md:py-24 bg-[#EAF0F6]/50 border-t border-[#DCE5EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-heading font-semibold tracking-wider text-[#475569] uppercase block mb-2">
            Curriculum Progression
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#243B53] tracking-tight">
            Browse by Semester
          </h2>
          <p className="mt-3 text-base text-[#475569] leading-relaxed">
            Viewing semesters currently active at the college for{' '}
            <span className="font-semibold text-[#243B53]">{currentProgramme.name}</span>.
            Higher semesters will be activated dynamically as batches progress.
          </p>
        </div>

        {/* Programme Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-4xl mx-auto">
          {INITIAL_PROGRAMMES.map((prog) => {
            const isSelected = prog.id === currentProgramme.id;
            return (
              <button
                key={prog.id}
                type="button"
                onClick={() => onProgrammeChange && onProgrammeChange(prog.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#243B53] text-white shadow-sm ring-2 ring-[#243B53]/20'
                    : 'bg-white hover:bg-[#DCE5EF] text-[#303846] border border-[#DCE5EF]'
                }`}
              >
                <span>{prog.name}</span>
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#F0F2F5] text-[#475569]'
                  }`}
                >
                  {prog.availableSemesters.length} {prog.availableSemesters.length === 1 ? 'Sem' : 'Sems'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Programme Summary Banner */}
        <div className="max-w-4xl mx-auto mb-8 bg-white rounded-xl border border-[#DCE5EF] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EAF0F6] flex items-center justify-center text-[#243B53] shrink-0 font-bold text-xs">
              {currentProgramme.code}
            </div>
            <div>
              <span className="font-heading font-bold text-sm text-[#243B53]">
                {currentProgramme.name} — {currentProgramme.fullName}
              </span>
              <p className="text-xs text-[#475569]">
                {currentProgramme.scheme} • Showing {availableSemesters.length} active {availableSemesters.length === 1 ? 'semester' : 'semesters'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#243B53] font-medium bg-[#EAF0F6] px-3 py-1 rounded-full border border-[#DCE5EF] shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>College Active Batch</span>
          </div>
        </div>

        {/* Available Semesters Grid (Shows ONLY the semesters under the selected programme) */}
        <div className={`grid gap-6 max-w-5xl mx-auto ${
          availableSemesters.length === 1
            ? 'grid-cols-1 max-w-md'
            : availableSemesters.length === 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {availableSemesters.map((sem) => {
            const IconComponent = semesterIcons[sem.semesterNumber] || BookOpen;

            return (
              <div
                key={sem.id}
                onClick={() =>
                  onSemesterSelect &&
                  onSemesterSelect({
                    ...sem,
                    programmeName: currentProgramme.name,
                    programmeScheme: currentProgramme.scheme,
                  })
                }
                className="group relative bg-white rounded-2xl p-6 border border-[#DCE5EF] shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#243B53]/40 hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top: Icon + Semester Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#EAF0F6] group-hover:bg-[#DCE5EF] flex items-center justify-center text-[#243B53] transition-colors duration-200">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-heading font-bold px-2.5 py-1 rounded-md bg-[#243B53] text-white tracking-wider">
                      S{sem.semesterNumber}
                    </span>
                  </div>

                  {/* Title & Degree Phase */}
                  <div className="mb-2">
                    <span className="text-[11px] font-semibold text-[#475569] tracking-wider uppercase block">
                      {sem.phase}
                    </span>
                    <h3 className="font-heading font-bold text-xl text-[#243B53] group-hover:text-[#1A2B3C] transition-colors">
                      {sem.title}
                    </h3>
                  </div>

                  {/* Focus & Description */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[#303846] mb-1">
                      {sem.focus}
                    </p>
                    <p className="text-xs text-[#475569] leading-relaxed line-clamp-3">
                      {sem.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 border-t border-[#DCE5EF] flex items-center justify-between text-xs font-heading font-semibold text-[#243B53]">
                  <span>Explore Materials</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Batch Progression Notice */}
        <div className="mt-12 text-center max-w-xl mx-auto">
          <p className="text-xs text-[#475569] bg-white/70 backdrop-blur-xs py-3 px-5 rounded-xl border border-[#DCE5EF]">
            Notice: Only current college-active semesters are enabled. Subsequent semesters are added by administrators as each batch advances.
          </p>
        </div>

      </div>
    </section>
  );
}
