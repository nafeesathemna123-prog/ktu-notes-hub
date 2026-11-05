import {
  BookOpenCheck,
  ShieldCheck,
  FileDown,
  Sparkles
} from 'lucide-react';

export function AboutSection() {
  const highlights = [
    {
      icon: ShieldCheck,
      title: '100% Free Public Access',
      description:
        'No student accounts, registrations, or login requirements. Every student gets immediate access to academic materials.',
    },
    {
      icon: BookOpenCheck,
      title: 'College Scope Focused',
      description:
        'Tailored specifically for the 7 programmes and 11 active semesters currently running at our college.',
    },
    {
      icon: FileDown,
      title: 'Reliable PDF Downloads',
      description:
        'Direct and fast access to complete lecture notes, problem sets, and revision guides in clean, printable PDF formats.',
    },
    {
      icon: Sparkles,
      title: 'Dynamic Administrator Curation',
      description:
        'Higher semesters, courses, and subjects are activated dynamically by administrators as batches progress.',
    },
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-[#F8F5ED] border-t border-[#DCE5EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: Left Narrative + Right Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Purpose & Narrative */}
          <div className="lg:col-span-5">
            <span className="text-xs font-heading font-semibold tracking-wider text-[#475569] uppercase block mb-2">
              About the Platform
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#243B53] tracking-tight leading-tight mb-6">
              A Tailored Academic Archive for Our College
            </h2>
            
            <div className="space-y-4 text-base text-[#303846] leading-relaxed">
              <p>
                <strong>KTU Notes Hub</strong> provides a single, trusted destination for curriculum-aligned lecture notes and exam revision material for our college community.
              </p>
              <p>
                Rather than cluttering students with irrelevant branches, this platform is tailored exclusively to our college's active programmes: <strong>B.Tech AI & DS, B.Tech CSE, B.Tech CSBS, BCA, BBA, MBA, and B.Tech ECE</strong>.
              </p>
              <p>
                As batches advance, the system enables administrators to dynamically activate subsequent semesters and publish verified subjects without code changes. Public students enjoy frictionless, account-free access at all times.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#DCE5EF] flex items-center gap-6">
              <div>
                <span className="font-heading font-bold text-2xl text-[#243B53] block">
                  7
                </span>
                <span className="text-xs text-[#475569]">Programmes</span>
              </div>
              <div className="w-px h-10 bg-[#DCE5EF]" />
              <div>
                <span className="font-heading font-bold text-2xl text-[#243B53] block">
                  11
                </span>
                <span className="text-xs text-[#475569]">Active Semesters</span>
              </div>
              <div className="w-px h-10 bg-[#DCE5EF]" />
              <div>
                <span className="font-heading font-bold text-2xl text-[#243B53] block">
                  100%
                </span>
                <span className="text-xs text-[#475569]">Public Access</span>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Core Pillars */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {highlights.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-[#DCE5EF] shadow-2xs hover:border-[#243B53]/30 transition-all duration-200"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#EAF0F6] flex items-center justify-center text-[#243B53] mb-4">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#243B53] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
