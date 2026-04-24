import React, { useEffect } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = ({ title, onClose, children, size = 'md' }: ModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.2)] w-full ${sizeClasses[size]}`}
        style={{ animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-0">
          <div className="text-[22px] font-extrabold text-text-main">{title}</div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-text-3 hover:text-text-main hover:bg-gray-100 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
  );
};

/* ── Shared form primitives ── */
export const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[13px] font-bold text-text-3 mb-2">{label}</label>
    {children}
  </div>
);

export const inputCls = "w-full bg-bg border border-border-light rounded-2xl py-3 px-4 text-[14px] font-semibold text-text-main focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder-text-3";

export const ModalActions = ({ onClose, loading, submitLabel = 'Save' }: { onClose: () => void; loading: boolean; submitLabel?: string }) => (
  <div className="flex justify-end gap-3 pt-2">
    <button
      type="button"
      onClick={onClose}
      className="bg-white border border-border-light text-text-main hover:bg-gray-50 rounded-2xl px-6 py-3 text-[14px] font-bold transition-all"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-6 py-3 text-[14px] font-bold transition-all shadow-[0_8px_20px_rgba(92,79,229,0.25)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
    >
      {loading ? 'Saving…' : submitLabel}
    </button>
  </div>
);
