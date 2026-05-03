import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export default function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = 'max-w-5xl' 
}: BaseModalProps) {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 sm:p-10 overflow-y-auto no-scrollbar"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full ${maxWidth} industrial-shadow flex flex-col relative my-auto max-h-[95vh] overflow-y-auto no-scrollbar`}
      >
        {/* Header */}
        <div className="px-6 py-6 sm:px-8 sm:py-6 bg-midnight-ink flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">{title}</h2>
            <div className="h-1 w-12 bg-primary mt-1"></div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}
