import { BookOpen, Shield } from 'lucide-react';

export function Footer({ onAdminClick, onBrowseClick }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#DCE5EF] pt-16 pb-12 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Info (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#243B53] flex items-center justify-center text-white shadow-2xs">
                <BookOpen className="w-5 h-5 text-[#B49A70]" />
              </div>
              <span className="font-heading font-bold text-lg text-[#243B53] tracking-tight">
                KMCT Notes Hub
              </span>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed max-w-sm">
              A centralised academic notes repository tailored exclusively to our college programmes. Free, frictionless public access for all enrolled students.
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#243B53] font-medium bg-[#EAF0F6] px-3 py-1 rounded-full border border-[#DCE5EF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B49A70]" />
                7 Active Programmes • 11 Semesters
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-[#243B53] tracking-wide uppercase">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-[#475569]">
              <li>
                <a href="#home" className="hover:text-[#243B53] transition-colors">
                  Home
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onBrowseClick}
                  className="hover:text-[#243B53] transition-colors text-left cursor-pointer"
                >
                  Browse Notes Library
                </button>
              </li>
              <li>
                <a href="#departments" className="hover:text-[#243B53] transition-colors">
                  Offered Programmes
                </a>
              </li>
              <li>
                <a href="#semesters" className="hover:text-[#243B53] transition-colors">
                  Active Semesters
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#243B53] transition-colors">
                  About Platform
                </a>
              </li>
            </ul>
          </div>

          {/* College Active Programmes (Strict Approved Order) */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-[#243B53] tracking-wide uppercase">
              Programmes
            </h4>
            <ul className="space-y-2 text-xs text-[#475569]">
              <li>1. B.Tech AI & DS (S1–S3)</li>
              <li>2. B.Tech CSE (S1–S3)</li>
              <li>3. B.Tech CSBS (S1)</li>
              <li>4. B.Tech ECE (S1)</li>
              <li>5. BCA (S1)</li>
              <li>6. BBA (S1)</li>
              <li>7. MBA (S1)</li>
            </ul>
          </div>

          {/* Platform & Access Governance */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-[#243B53] tracking-wide uppercase">
              Access & Governance
            </h4>
            <ul className="space-y-2 text-xs text-[#475569]">
              <li>
                <span className="text-[#303846] font-medium">Student Access:</span> Free Public (No Sign-in)
              </li>
              <li>
                <span className="text-[#303846] font-medium">Curriculum:</span> College Active Batches
              </li>
              <li>
                <span className="text-[#303846] font-medium">Format:</span> Clean PDF Documents
              </li>
              <li className="pt-2">
                <button
                  type="button"
                  onClick={onAdminClick}
                  className="inline-flex items-center gap-1.5 text-xs text-[#243B53] hover:text-[#1A2B3C] font-semibold underline underline-offset-4 decoration-[#DCE5EF] hover:decoration-[#B49A70] transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-[#B49A70]" />
                  <span>Administrator Portal</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal Disclaimer & Copyright */}
        <div className="pt-8 border-t border-[#DCE5EF] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#475569]">
          <p>
            © {currentYear} KMCT Notes Hub. Tailored for College Academic Programmes.
          </p>
          <p className="text-center md:text-right max-w-lg text-[11px] text-[#475569]/80">
            Disclaimer: KMCT Notes Hub is an independent academic resource library for our college programmes. All course syllabus names and university designations refer to respective university bodies.
          </p>
        </div>

      </div>
    </footer>
  );
}
