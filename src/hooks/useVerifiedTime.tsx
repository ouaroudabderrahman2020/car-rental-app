import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type SyncStatus = 'syncing' | 'success' | 'error';

interface VerifiedTimeContextType {
  verifiedTime: Date;
  isSynced: boolean;
  syncStatus: SyncStatus;
  syncNow: () => Promise<void>;
}

const VerifiedTimeContext = createContext<VerifiedTimeContextType | undefined>(undefined);

export function VerifiedTimeProvider({ children }: { children: React.ReactNode }) {
  const [offset, setOffset] = useState<number>(0);
  const [isSynced, setIsSynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const [now, setNow] = useState(new Date());
  
  const driftWatchdogRef = useRef<number>(Date.now());
  const isSyncingRef = useRef(false);
  const hourlyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWithTimeout = async (url: string, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  const syncWithServer = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus('syncing');

    const tryLayer1 = async () => {
      const data = await fetchWithTimeout('https://worldtimeapi.org/api/timezone/Africa/Casablanca');
      return new Date(data.datetime).getTime();
    };

    const tryLayer2 = async () => {
      const data = await fetchWithTimeout('https://www.timeapi.io/api/Time/current/zone?timeZone=Africa/Casablanca');
      return new Date(data.dateTime).getTime();
    };

    const tryLayer3 = async () => {
      const data = await fetchWithTimeout('https://worldclockapi.com/api/json/utc/now');
      return new Date(data.currentDateTime).getTime();
    };

    const layers = [tryLayer1, tryLayer2, tryLayer3];
    let serverTimestamp: number | null = null;
    let success = false;

    for (let i = 0; i < layers.length; i++) {
       try {
        console.log(`[ClockService] Attempting Layer ${i + 1}...`);
        const t1 = Date.now();
        serverTimestamp = await layers[i]();
        const t2 = Date.now();
        const rtt = t2 - t1;
        
        const newOffset = (serverTimestamp + rtt / 2) - t2;
        setOffset(newOffset);
        setIsSynced(true);
        setSyncStatus('success');
        success = true;
        console.log(`[ClockService] Layer ${i + 1} Success. Offset: ${newOffset}ms`);
        break;
      } catch (err) {
        console.warn(`[ClockService] Layer ${i + 1} Failed:`, err);
      }
    }

    if (!success) {
      setSyncStatus('error');
      console.error('[ClockService] All layers failed. Retrying in 30s...');
      setTimeout(syncWithServer, 30000);
    } else {
      if (hourlyTimeoutRef.current) clearTimeout(hourlyTimeoutRef.current);
      hourlyTimeoutRef.current = setTimeout(syncWithServer, 3600000);
    }

    isSyncingRef.current = false;
  }, []);

  useEffect(() => {
    syncWithServer();

    const tickerInterval = setInterval(() => {
      setNow(new Date(Date.now() + offset));
    }, 1000);

    const watchdogInterval = setInterval(() => {
      const currentLocal = Date.now();
      const diff = Math.abs(currentLocal - driftWatchdogRef.current - 2000);
      
      if (diff > 10000) {
        console.warn(`[ClockService] Time drift detected (${diff}ms). Emergency re-sync...`);
        syncWithServer();
      }
      driftWatchdogRef.current = currentLocal;
    }, 2000);

    return () => {
      if (hourlyTimeoutRef.current) clearTimeout(hourlyTimeoutRef.current);
      clearInterval(tickerInterval);
      clearInterval(watchdogInterval);
    };
  }, [syncWithServer, offset]);

  // Update immediately when offset changes
  useEffect(() => {
    setNow(new Date(Date.now() + offset));
  }, [offset]);

  const value = {
    verifiedTime: now,
    isSynced,
    syncStatus,
    syncNow: syncWithServer
  };

  return (
    <VerifiedTimeContext.Provider value={value}>
      {children}
    </VerifiedTimeContext.Provider>
  );
}

export function useVerifiedTime() {
  const context = useContext(VerifiedTimeContext);
  if (context === undefined) {
    throw new Error('useVerifiedTime must be used within a VerifiedTimeProvider');
  }
  return context;
}
