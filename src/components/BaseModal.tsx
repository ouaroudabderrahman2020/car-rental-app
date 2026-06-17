import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  closeDisabled?: boolean;
}

export default function BaseModal({ isOpen, onClose, title, children, actions, closeDisabled }: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-full rounded-2xl shadow-2xl flex flex-col relative max-h-[calc(100vh-64px)] overflow-y-auto black-scrollbar bg-clip-padding"
      >
        <div className="sticky top-0 z-50 px-6 py-2 sm:px-8 bg-blue-50 flex items-center shrink-0 border-b border-blue-200 bg-clip-padding">
          <div className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-widest">{title}</div>
          <div className="ml-auto flex items-center gap-2">
            {actions}
            <button
              onClick={onClose}
              disabled={closeDisabled}
              className="group p-2 -mr-2 text-slate-900 hover:bg-slate-200/50 transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:rotate-90" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
      </motion.div>
    </div>
  );
}
