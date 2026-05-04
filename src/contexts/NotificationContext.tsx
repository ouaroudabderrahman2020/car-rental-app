import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info';
}

interface NotificationContextType {
  showToast: (message: string, type?: NotificationType) => void;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [confirmation, setConfirmation] = useState<{
    options: ConfirmationOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showToast = (message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const confirm = (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmation({ options, resolve });
    });
  };

  const handleConfirmAction = (value: boolean) => {
    if (confirmation) {
      confirmation.resolve(value);
      setConfirmation(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast, confirm }}>
      {children}

      {/* Toasts Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`
                pointer-events-auto
                flex items-center gap-3 px-4 py-3 bg-white border-2 border-black
                font-black uppercase text-xs tracking-widest industrial-shadow min-w-[280px]
              `}
            >
              <div className={
                toast.type === 'success' ? 'text-green-600' : 
                toast.type === 'error' ? 'text-red-600' : 'text-primary'
              }>
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
                {toast.type === 'info' && <HelpCircle className="w-4 h-4" />}
              </div>
              <span className="flex-1 text-black">{toast.message}</span>
              <button 
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="p-1 hover:bg-black/5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmation && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleConfirmAction(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white border-2 border-black p-6 industrial-shadow overflow-hidden"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-2 border-2 border-black ${confirmation.options.type === 'danger' ? 'bg-red-600 text-white' : 'bg-primary text-white'}`}>
                  {confirmation.options.type === 'danger' ? <AlertCircle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-black uppercase tracking-tighter text-lg leading-tight mb-1 text-midnight-ink">
                    {confirmation.options.title}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-relaxed">
                    {confirmation.options.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => handleConfirmAction(false)}
                  className="flex-1 px-4 py-3 bg-white border-2 border-black text-black font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-colors"
                >
                  {confirmation.options.cancelLabel || 'Cancel'}
                </button>
                <button
                  onClick={() => handleConfirmAction(true)}
                  className={`flex-1 px-4 py-3 border-2 border-black text-white font-black uppercase text-[10px] tracking-widest transition-colors ${
                    confirmation.options.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {confirmation.options.confirmLabel || 'Confirm'}
                </button>
              </div>

              {/* Decorative stripes */}
              <div className="absolute top-0 right-0 h-1 w-full flex">
                <div className="flex-1 bg-primary"></div>
                <div className="flex-1 bg-black"></div>
                <div className="flex-1 bg-primary"></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};
