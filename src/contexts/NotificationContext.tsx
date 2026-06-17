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
                flex items-center gap-3 px-5 py-3 bg-white shadow-xl rounded-full
                font-semibold text-sm min-w-[300px] border border-slate-100
              `}
            >
              <div className={
                toast.type === 'success' ? 'text-green-600' : 
                toast.type === 'error' ? 'text-red-600' : 'text-blue-600'
              }>
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {toast.type === 'info' && <HelpCircle className="w-5 h-5" />}
              </div>
              <span className="flex-1 text-slate-700">{toast.message}</span>
              <button 
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X className="w-4 h-4" />
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
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[380px] bg-white rounded-2xl p-6 shadow-xl overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl ${
                  confirmation.options.type === 'danger' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {confirmation.options.type === 'danger' 
                    ? <AlertCircle className="w-[22px] h-[22px]" /> 
                    : <HelpCircle className="w-[22px] h-[22px]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-900 leading-tight truncate">
                    {confirmation.options.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {confirmation.options.message}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleConfirmAction(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-600 font-semibold text-sm rounded-full hover:bg-slate-100 transition-colors order-2 sm:order-1"
                >
                  {confirmation.options.cancelLabel || 'Cancel'}
                </button>
                <button
                  onClick={() => handleConfirmAction(true)}
                  className={`flex-1 px-4 py-2.5 text-white font-semibold text-sm rounded-full transition-all shadow-sm order-1 sm:order-2 ${
                    confirmation.options.type === 'danger' 
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  }`}
                >
                  {confirmation.options.confirmLabel || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};
