import { useState } from 'react';
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

  // Quick pills matching the college's 7 active programmes
  const quickPills = [
    'B.Tech AI & DS',
    'B.Tech CSE',
    'B.Tech CSBS',
    'BCA',
    'BBA',
    'MBA',
    'ECE',
  ];

  return (
    <section id="home" className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Subtle Upper Eyebrow / Label */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF0F6] border border-[#DCE5EF] text-[#243B53]">
            <span className="w-2 h-2 rounded-full bg-[#243B53]" />
            <span className="text-xs font-heading font-semibold tracking-wide uppercase">
              College Academic Library • KTU & University Programmes
            </span>
          </div>
        </div>

        {/* Main Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#243B53] tracking-tight leading-[1.15] mb-6">
            Your KTU Learning Hub
          </h1>
          <p className="font-sans text-lg sm:text-xl text-[#303846] leading-relaxed max-w-2xl mx-auto">
            Find, explore and access academic notes for your KTU engineering and college programmes — all in one place.
          </p>
        </div>

        {/* Prominent Search Bar Container */}
        <div className="max-w-2xl mx-auto mb-10">
          <form
            onSubmit={handleSubmit}
            className={`relative flex items-center bg-white rounded-2xl border transition-all duration-200 shadow-sm ${
              searchFocused
                ? 'border-[#243B53] ring-4 ring-[#DCE5EF]'
                : 'border-[#DCE5EF] hover:border-[#243B53]/50'
            }`}
          >
            <div className="pl-5 text-[#243B53] flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search by programme, subject, or topic (e.g., AI & DS, Mathematics)..."
              className="w-full py-4 pl-3 pr-10 text-base font-sans text-[#303846] placeholder:text-[#475569] bg-transparent focus:outline-none"
              aria-label="Search notes"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 mr-2 text-[#475569] hover:text-[#243B53] rounded-md transition-colors"
                aria-label="Clear search text"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 mr-2 bg-[#243B53] hover:bg-[#1A2B3C] text-white font-heading font-semibold text-sm rounded-xl transition-colors duration-200"
            >
              Search
            </button>
          </form>

          {/* Quick Search Suggestions */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-[#475569]">
            <span className="font-medium">Offered Programmes:</span>
            {quickPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => {
                  setSearchQuery(pill);
                  if (onSearchSubmit) onSearchSubmit(pill);
                }}
                className="px-2.5 py-1 rounded-md bg-[#F0F2F5] hover:bg-[#DCE5EF] text-[#303846] transition-colors border border-[#DCE5EF]/60 font-medium cursor-pointer"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            type="button"
            onClick={onBrowseClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#243B53] hover:bg-[#1A2B3C] text-white font-heading font-semibold text-base transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] group"
          >
            <span>Browse Notes Library</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <a
            href="#semesters"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-[#EAF0F6] text-[#243B53] font-heading font-semibold text-base border border-[#DCE5EF] transition-all duration-200 shadow-sm"
          >
            <span>Explore Active Semesters</span>
          </a>
        </div>

        {/* Academic-Themed Editorial Card / Trust Indicators */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-[#DCE5EF] p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#DCE5EF]">
              
              {/* Feature 1 */}
              <div className="flex items-start gap-4 pt-4 md:pt-0">
                <div className="w-10 h-10 rounded-xl bg-[#EAF0F6] flex-shrink-0 flex items-center justify-center text-[#243B53]">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#243B53] mb-1">
                    7 College Programmes
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Dedicated archives for B.Tech AI & DS, CSE, CSBS, ECE, BCA, BBA, and MBA.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 pt-4 md:pt-0 md:pl-6">
                <div className="w-10 h-10 rounded-xl bg-[#EAF0F6] flex-shrink-0 flex items-center justify-center text-[#243B53]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#243B53] mb-1">
                    Frictionless Access
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    No student registration or accounts required. Immediate access for all learners.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 pt-4 md:pt-0 md:pl-6">
                <div className="w-10 h-10 rounded-xl bg-[#EAF0F6] flex-shrink-0 flex items-center justify-center text-[#243B53]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#243B53] mb-1">
                    Curated PDF Notes
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Organised across 11 active semester combinations with clean PDF downloads.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
