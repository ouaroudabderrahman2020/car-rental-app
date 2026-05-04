import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  hideHeader?: boolean;
  headerBg?: string;
}

export default function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = 'max-w-5xl',
  hideHeader = false,
  headerBg = 'bg-white'
}: BaseModalProps) {
  const { t } = useTranslation();
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-hidden"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full ${maxWidth} border-2 border-black industrial-shadow flex flex-col relative max-h-[85vh] overflow-y-auto no-scrollbar`}
      >
        {/* Header */}
        {!hideHeader && (
          <div className={`sticky top-0 z-20 px-6 py-2 sm:px-8 ${headerBg} flex justify-between items-center shrink-0 border-b-2 border-black`}>
            <div className="flex-1">
              <div className="text-lg sm:text-xl font-black text-black uppercase tracking-widest">{title}</div>
            </div>
            <button 
              onClick={onClose} 
              className="group p-2 -mr-2 text-black hover:bg-black/5 transition-colors active:scale-95"
              aria-label="Close"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:rotate-90" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t-2 border-black bg-slate-50">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}
