import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

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
  
  const lastSyncRef = useRef<number>(0);
  const driftWatchdogRef = useRef<number>(Date.now());
  const failCountRef = useRef(0);

  const syncWithServer = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const t1 = Date.now();
      
      const { data, error } = await supabase.rpc('get_server_time');
      
      if (error) throw error;

      const t2 = Date.now();
      const serverTime = new Date(data).getTime();
      const rtt = t2 - t1;
      
      const newOffset = (serverTime + rtt / 2) - t2;
      
      setOffset(newOffset);
      setIsSynced(true);
      setSyncStatus('success');
      failCountRef.current = 0;
      lastSyncRef.current = Date.now();
      console.log(`[ClockService] Synced. Latency: ${rtt}ms, Offset: ${newOffset}ms`);
    } catch (err) {
      failCountRef.current += 1;
      console.error(`[ClockService] Sync failed (${failCountRef.current}/5):`, err);
      
      if (failCountRef.current >= 5) {
        setSyncStatus('error');
      } else {
        // Retry logic after failure
        setTimeout(syncWithServer, 5000);
      }
    }
  }, []);

  // Initial Sync
  useEffect(() => {
    syncWithServer();

    // Hourly Calibration
    const calibrationInterval = setInterval(syncWithServer, 3600000);

    // Minute Ticker for UI
    const tickerInterval = setInterval(() => {
      setNow(new Date(Date.now() + offset));
    }, 60000);

    // Watchdog: Check for 10s drift or system time change
    const watchdogInterval = setInterval(() => {
      const currentLocal = Date.now();
      const diff = Math.abs(currentLocal - driftWatchdogRef.current - 2000); // 2000 is the check interval
      
      if (diff > 10000) {
        console.warn(`[ClockService] Time drift detected (${diff}ms). Emergency re-sync...`);
        syncWithServer();
      }
      driftWatchdogRef.current = currentLocal;
    }, 2000);

    return () => {
      clearInterval(calibrationInterval);
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
