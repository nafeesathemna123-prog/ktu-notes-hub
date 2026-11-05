import { useEffect } from 'react';
import { X, Info } from 'lucide-react';

export function Modal({ isOpen, onClose, title, subtitle, icon: Icon = Info, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#243B53]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
        className="relative w-full max-w-lg bg-white rounded-2xl border border-[#DCE5EF] shadow-xl p-6 sm:p-8 z-10 transition-all animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF0F6] flex items-center justify-center text-[#243B53] shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-headline" className="font-heading font-bold text-lg text-[#243B53]">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-[#475569]">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#243B53] hover:bg-[#F0F2F5] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="text-sm text-[#303846] leading-relaxed mb-6">
          {children}
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE5EF]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#243B53] hover:bg-[#1A2B3C] text-white font-heading font-semibold text-sm transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
