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
  const offsetRef = useRef<number>(0);
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
      const response = await fetch('https://www.timeapi.io/api/Time/current/zone?timeZone=Africa/Casablanca');
      if (!response.ok) throw new Error('TimeAPI failed');
      const data = await response.json();
      return new Date(data.dateTime).getTime();
    };

    const tryLayer2 = async () => {
      // Use Google's Date header as a very reliable fallback
      const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
      const dateHeader = response.headers.get('Date');
      if (!dateHeader) throw new Error('No Date header');
      // GMT+1 is 3600000ms offset from GMT
      return new Date(dateHeader).getTime() + 3600000;
    };

    const tryLayer3 = async () => {
      const response = await fetch('https://worldtimeapi.org/api/timezone/Africa/Casablanca');
      if (!response.ok) throw new Error('WorldTimeAPI failed');
      const data = await response.json();
      return new Date(data.datetime).getTime();
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
        offsetRef.current = newOffset;
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
      console.error('[ClockService] All layers failed. Falling back to system time. Retrying in 1 hour...');
      // Fallback to system time, but mark as not fully synced
      setIsSynced(false);
      
      // Ensure we don't start multiple parallel retries
      if (hourlyTimeoutRef.current) clearTimeout(hourlyTimeoutRef.current);
      hourlyTimeoutRef.current = setTimeout(() => {
        isSyncingRef.current = false;
        syncWithServer();
      }, 3600000); // Retry in 1 hour
    } else {
      if (hourlyTimeoutRef.current) clearTimeout(hourlyTimeoutRef.current);
      hourlyTimeoutRef.current = setTimeout(() => {
        isSyncingRef.current = false;
        syncWithServer();
      }, 3600000);
    }

    if (success) isSyncingRef.current = false;
  }, []);

  useEffect(() => {
    syncWithServer();

    const tickerInterval = setInterval(() => {
      setNow(new Date(Date.now() + offsetRef.current));
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
  }, [syncWithServer]);

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
