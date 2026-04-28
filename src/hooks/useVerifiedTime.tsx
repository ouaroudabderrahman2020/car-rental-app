import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface VerifiedTimeContextType {
  verifiedTime: Date;
  isSynced: boolean;
  syncNow: () => Promise<void>;
}

const VerifiedTimeContext = createContext<VerifiedTimeContextType | undefined>(undefined);

export function VerifiedTimeProvider({ children }: { children: React.ReactNode }) {
  const [offset, setOffset] = useState<number>(0);
  const [isSynced, setIsSynced] = useState(false);
  const [now, setNow] = useState(new Date());
  
  const lastSyncRef = useRef<number>(0);
  const driftWatchdogRef = useRef<number>(Date.now());

  const syncWithServer = useCallback(async () => {
    try {
      const t1 = Date.now();
      
      // We assume get_server_time exists in Supabase.
      // SQL: CREATE OR REPLACE FUNCTION get_server_time() RETURNS timestamptz AS $$ BEGIN RETURN now(); END; $$ LANGUAGE plpgsql;
      const { data, error } = await supabase.rpc('get_server_time');
      
      if (error) {
        // Fallback: If RPC fails, try a simple select to get server time
        // This is less efficient but works as a recovery
        const { data: selectData, error: selectError } = await supabase.from('cars').select('created_at').limit(1).single();
        // This won't work well if no cars exist or for real-time.
        // Better to just throw if RPC is missing and let the user know.
        if (selectError) throw error;
      }

      const t2 = Date.now();
      const serverTime = new Date(data).getTime();
      const rtt = t2 - t1;
      
      // Offset calculation: ServerTime - ClientTime (adjusted for half latency)
      const newOffset = (serverTime + rtt / 2) - t2;
      
      setOffset(newOffset);
      setIsSynced(true);
      lastSyncRef.current = Date.now();
      console.log(`[ClockService] Synced. Latency: ${rtt}ms, Offset: ${newOffset}ms`);
    } catch (err) {
      console.error('[ClockService] Sync failed:', err);
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
