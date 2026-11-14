import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export function AdminLoginModal({ isOpen, onClose, onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both administrative email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      setEmail('');
      setPassword('');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#243B53]/50 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Surface */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-white rounded-3xl border border-[#DCE5EF] shadow-2xl p-6 sm:p-8 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-[#475569] hover:text-[#243B53] hover:bg-[#F0F2F5] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Luxury Brand Accent */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#243B53] flex items-center justify-center text-white shadow-xs">
            <Shield className="w-6 h-6 text-[#B49A70]" />
          </div>
          <div>
            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-[#B49A70] block">
              KMCT Notes Hub
            </span>
            <h3 id="admin-dialog-title" className="font-heading font-bold text-xl text-[#243B53]">
              Administrator Portal
            </h3>
          </div>
        </div>

        {/* Scope Note */}
        <div className="p-3.5 rounded-xl bg-[#EAF0F6] border border-[#DCE5EF] text-xs text-[#475569] mb-6 leading-relaxed">
          <p>
            <strong className="text-[#243B53] font-heading">Restricted Access:</strong> Strictly reserved for verified college faculty and administrators to curate curriculum records and upload PDF notes. Students do not require accounts.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-tight">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@kmct.edu.in"
                className="w-full pl-10 pr-4 py-3 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-sm font-sans text-[#303846] placeholder:text-[#475569]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B49A70]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-heading font-semibold text-[#243B53] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 bg-[#F8F5ED]/50 border border-[#DCE5EF] rounded-xl text-sm font-sans text-[#303846] placeholder:text-[#475569]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B49A70]/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#243B53] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#243B53] hover:bg-[#1A2B3C] text-white font-heading font-semibold text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#B49A70]" />
                  <span>Authenticate Admin</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#DCE5EF] text-center text-[11px] text-[#475569]">
          <span>Need initial super-admin credentials?</span>{' '}
          <span className="font-semibold text-[#243B53]">Refer to project setup documentation</span>
        </div>
      </motion.div>
    </div>
  );
}
