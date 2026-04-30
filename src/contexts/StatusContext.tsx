import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type StatusType = 'idle' | 'processing' | 'success' | 'error';

interface StatusContextType {
  status: string;
  type: StatusType;
  setStatus: (message: string, type?: StatusType, duration?: number) => void;
  clearStatus: () => void;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export const StatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [status, setStatusState] = useState<string>('');
  const [type, setType] = useState<StatusType>('idle');
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearStatus = useCallback(() => {
    setStatusState('');
    setType('idle');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const setStatus = useCallback((message: string, statusType: StatusType = 'processing', duration: number = 4000) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setStatusState(message);
    setType(statusType);

    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        setStatusState('');
        setType('idle');
      }, duration);
    }
  }, []);

  return (
    <StatusContext.Provider value={{ status, type, setStatus, clearStatus }}>
      {children}
    </StatusContext.Provider>
  );
};

export const useStatus = () => {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};
