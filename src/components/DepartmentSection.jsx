import {
  Bot,
  Cpu,
  Binary,
  Code2,
  Briefcase,
  GraduationCap,
  Radio,
  ArrowUpRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { departments } from '../data/departments';

// Icon map helper for the college's 7 programmes
const iconMap = {
  Bot,
  Cpu,
  Binary,
  Code2,
  Briefcase,
  GraduationCap,
  Radio,
};

export function DepartmentSection({ selectedProgrammeId, onProgrammeSelect }) {
  const handleCardClick = (dept) => {
    if (onProgrammeSelect) {
      onProgrammeSelect(dept);
    }
    // Smoothly scroll down to the semesters section
    const semSection = document.getElementById('semesters');
    if (semSection) {
      semSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="departments" className="py-16 md:py-24 bg-[#F8F5ED] border-t border-[#DCE5EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-heading font-semibold tracking-wider text-[#475569] uppercase block mb-2">
              College Academic Programmes
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#243B53] tracking-tight">
              Browse by Programme
            </h2>
            <p className="mt-3 text-base text-[#475569] leading-relaxed">
              Select your programme to view its active semester notes and syllabus materials. Only the programmes and semesters currently offered at the college are displayed.
            </p>
          </div>

          {/* Academic Scope Info Banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#DCE5EF] text-xs text-[#303846] shadow-2xs self-start md:self-auto">
            <Info className="w-4 h-4 text-[#243B53] shrink-0" />
            <span>7 Active Programmes • 11 Semesters</span>
          </div>
        </div>

        {/* 7 Programmes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {departments.map((dept) => {
            const IconComponent = iconMap[dept.iconName] || Cpu;
            const isSelected = selectedProgrammeId === dept.id;

            return (
              <div
                key={dept.id}
                onClick={() => handleCardClick(dept)}
                className={`group relative bg-white rounded-2xl p-6 border shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#243B53] ring-2 ring-[#243B53]/20 bg-white'
                    : 'border-[#DCE5EF] hover:border-[#243B53]/40'
                }`}
              >
                <div>
                  {/* Top Row: Icon + Code Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#EAF0F6] group-hover:bg-[#DCE5EF] flex items-center justify-center text-[#243B53] transition-colors duration-200">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-heading font-semibold text-[#243B53] bg-[#EAF0F6] px-2 py-0.5 rounded-md border border-[#DCE5EF]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                      <span className="text-xs font-heading font-bold px-2.5 py-1 rounded-md bg-[#F0F2F5] text-[#243B53] border border-[#DCE5EF]">
                        {dept.code}
                      </span>
                    </div>
                  </div>

                  {/* Programme Name & Full Title */}
                  <h3 className="font-heading font-bold text-lg text-[#243B53] mb-1 leading-snug group-hover:text-[#1A2B3C] transition-colors">
                    {dept.name}
                  </h3>
                  <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wide block mb-2">
                    {dept.scheme}
                  </span>

                  <p className="text-xs text-[#475569] leading-relaxed line-clamp-3 mb-6">
                    {dept.description}
                  </p>
                </div>

                {/* Bottom Row: Semester Availability & Action Arrow */}
                <div className="pt-4 border-t border-[#DCE5EF] flex items-center justify-between text-xs">
                  <span className="font-medium text-[#243B53] bg-[#EAF0F6] px-2 py-0.5 rounded text-[11px]">
                    {dept.modulesCount}
                  </span>
                  <div className="flex items-center gap-1 font-heading font-semibold text-[#243B53] group-hover:translate-x-0.5 transition-transform duration-200">
                    <span>View Semesters</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
