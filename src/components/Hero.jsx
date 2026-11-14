import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, GraduationCap, FileText, CheckCircle2, X } from 'lucide-react';

export function Hero({ onSearchSubmit, onBrowseClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  // Quick pills matching the college's 7 active programmes in strict approved order
  const quickPills = [
    'B.Tech AI & DS',
    'B.Tech CSE',
    'B.Tech CSBS',
    'B.Tech ECE',
    'BCA',
    'BBA',
    'MBA',
  ];

  return (
    <section id="home" className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-[#F8F5ED]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Subtle Upper Eyebrow / Label */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DCE5EF] text-[#243B53] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#B49A70]" />
            <span className="text-xs font-heading font-semibold tracking-wide uppercase">
              KMCT Notes Hub • College Academic Library
            </span>
          </div>
        </motion.div>

        {/* Main Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#243B53] tracking-tight leading-[1.15] mb-5">
            Your Central Academic Resource Library
          </h1>
          <p className="font-sans text-base sm:text-lg text-[#303846] leading-relaxed max-w-2xl mx-auto">
            Find, explore, and access curriculum-aligned lecture notes and PDF revision materials for our college programmes — all in one place, 100% free for all students.
          </p>
        </motion.div>

        {/* Prominent Search Bar Container */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-10"
        >
          <form
            onSubmit={handleSubmit}
            className={`relative flex items-center bg-white rounded-2xl border transition-all duration-200 shadow-sm ${
              searchFocused
                ? 'border-[#B49A70] ring-4 ring-[#DCE5EF]'
                : 'border-[#DCE5EF] hover:border-[#B49A70]/60'
            }`}
          >
            <div className="pl-5 text-[#243B53] flex items-center justify-center">
              <Search className="w-5 h-5 text-[#B49A70]" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search by programme or subject (e.g. AI & DS, Mathematics)..."
              className="w-full py-4 pl-3 pr-10 text-base font-sans text-[#303846] placeholder:text-[#475569]/70 bg-transparent focus:outline-none"
              aria-label="Search notes"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 mr-2 text-[#475569] hover:text-[#243B53] rounded-md transition-colors cursor-pointer"
                aria-label="Clear search text"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 mr-2 bg-[#243B53] hover:bg-[#1A2B3C] text-white font-heading font-semibold text-sm rounded-xl transition-colors duration-200 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Quick Search Suggestions (All 7 Programmes in Approved Order) */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs text-[#475569]">
            <span className="font-medium text-[#243B53]">Offered Programmes:</span>
            {quickPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => {
                  setSearchQuery(pill);
                  if (onSearchSubmit) onSearchSubmit(pill);
                }}
                className="px-2.5 py-1 rounded-md bg-white hover:bg-[#EAF0F6] text-[#303846] hover:text-[#243B53] transition-colors border border-[#DCE5EF] font-medium cursor-pointer shadow-2xs"
              >
                {pill}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            type="button"
            onClick={onBrowseClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#243B53] hover:bg-[#1A2B3C] text-white font-heading font-semibold text-base transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] group cursor-pointer"
          >
            <span>Browse Notes Library</span>
            <ArrowRight className="w-4 h-4 text-[#B49A70] transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <a
            href="#semesters"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-[#EAF0F6] text-[#243B53] font-heading font-semibold text-base border border-[#DCE5EF] transition-all duration-200 shadow-sm cursor-pointer"
          >
            <span>Explore Active Semesters</span>
          </a>
        </motion.div>

        {/* Academic-Themed Editorial Card / Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl border border-[#DCE5EF] p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#DCE5EF]">
              
              {/* Feature 1 */}
              <div className="flex items-start gap-4 pt-4 md:pt-0">
                <div className="w-10 h-10 rounded-xl bg-[#EAF0F6] flex-shrink-0 flex items-center justify-center text-[#243B53]">
                  <GraduationCap className="w-5 h-5 text-[#B49A70]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#243B53] mb-1">
                    7 College Programmes
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Tailored archives for B.Tech AI & DS, CSE, CSBS, ECE, BCA, BBA, and MBA.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 pt-4 md:pt-0 md:pl-6">
                <div className="w-10 h-10 rounded-xl bg-[#EAF0F6] flex-shrink-0 flex items-center justify-center text-[#243B53]">
                  <CheckCircle2 className="w-5 h-5 text-[#B49A70]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#243B53] mb-1">
                    Frictionless Public Access
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    No student registrations, profiles, or passwords required. 100% free access for all learners.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 pt-4 md:pt-0 md:pl-6">
                <div className="w-10 h-10 rounded-xl bg-[#EAF0F6] flex-shrink-0 flex items-center justify-center text-[#243B53]">
                  <FileText className="w-5 h-5 text-[#B49A70]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#243B53] mb-1">
                    Curated PDF Notes
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Organised across 11 active semester combinations with clean PDF viewing and downloads.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
