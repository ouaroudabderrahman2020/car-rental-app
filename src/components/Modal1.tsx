import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import CalculatorTool from './tools/CalculatorTool';
import CalendarTool from './tools/CalendarTool';
import ImageToPdf from './tools/ImageToPdf';

interface Modal1Props {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  children?: React.ReactNode;
}

export default function Modal1({ isOpen, onClose, toolName, children }: Modal1Props) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const renderTool = () => {
    switch (toolName) {
      case 'Calculator':
        return <CalculatorTool />;
      case 'Calendar':
        return <CalendarTool />;
      case 'Image to PDF':
        return <ImageToPdf />;
      default:
        return (
          <div className="text-center space-y-4 opacity-20">
            <div className="w-24 h-24 border-4 border-dashed border-midnight-ink rounded-full mx-auto animate-spin-slow flex items-center justify-center">
              <div className="w-12 h-12 bg-midnight-ink rounded-full"></div>
            </div>
            <p className="font-bold uppercase tracking-[0.3em] text-midnight-ink">{t('common.noData')}</p>
          </div>
        );
    }
  };

  const getTranslatedToolName = (name: string) => {
    if (name === 'Calculator') return t('tools.calculator');
    if (name === 'Calendar') return t('tools.calendar');
    if (name === 'Image to PDF') return t('tools.imageToPdf');
    return name;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 sm:p-10 overflow-y-auto no-scrollbar">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl industrial-shadow flex flex-col relative my-auto max-h-[95vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="px-6 py-6 sm:px-8 sm:py-6 bg-midnight-ink flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">{getTranslatedToolName(toolName)}</h2>
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
        <div className="flex-1 p-4 sm:p-10 overflow-y-auto min-h-[500px]">
          {children || renderTool()}
        </div>

        {/* Footer */}
        <div className="px-6 py-6 sm:px-8 bg-white border-t border-midnight-ink/10 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-midnight-ink text-white font-black uppercase tracking-[0.2em] industrial-shadow hover:bg-primary transition-all active:scale-[0.98]"
          >
            {t('reservationDetails.close')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
