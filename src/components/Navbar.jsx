import { useState } from 'react';
import { BookOpen, Menu, X, ArrowRight } from 'lucide-react';

export function Navbar({ onBrowseClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Departments', href: '#departments' },
    { name: 'Semesters', href: '#semesters' },
    { name: 'About', href: '#about' },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-[#DCE5EF] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Identity */}
          <a
            href="#home"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#243B53] rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-[#243B53] flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <BookOpen className="w-5 h-5 text-[#F8F5ED]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg text-[#243B53] tracking-tight leading-tight">
                KTU Notes Hub
              </span>
              <span className="text-[11px] font-medium text-[#475569] tracking-wider uppercase">
                2024 Scheme Library
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="font-heading font-medium text-sm text-[#303846] hover:text-[#243B53] transition-colors py-1 relative group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#243B53] transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Right Action: Browse Notes CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={onBrowseClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#243B53] hover:bg-[#1A2B3C] text-white font-heading font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#243B53] focus-visible:ring-offset-2"
            >
              <span>Browse Notes</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#243B53] hover:bg-[#F0F2F5] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#243B53]"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DCE5EF] bg-white px-4 pt-3 pb-6 space-y-3 shadow-md animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-3 py-2 rounded-md font-heading font-medium text-base text-[#303846] hover:text-[#243B53] hover:bg-[#F0F2F5] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-[#DCE5EF]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onBrowseClick();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#243B53] text-white font-heading font-semibold text-sm transition-colors hover:bg-[#1A2B3C]"
            >
              <span>Browse Notes Library</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
