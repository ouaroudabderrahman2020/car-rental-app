import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export type SyncStatus = 'syncing' | 'success' | 'error';

interface VerifiedTimeContextType {
  verifiedTime: Date;
  isSynced: boolean;
  syncStatus: SyncStatus;
  syncNow: () => Promise<void>;
}

const VerifiedTimeContext = createContext<VerifiedTimeContextType | undefined>(undefined);

const LS_KEY = 'clock_verified_timestamp';
const CACHE_MAX_AGE = 86400000;
const FETCH_TIMEOUT = 5000;
const LAYER_DELAY = 500;
const INTERVAL_SUCCESS = 3600000;
const RETRY_BASE = 60000;
const RETRY_MAX = 1800000;
const TICK_INTERVAL = 1000;
const WATCHDOG_INTERVAL = 2000;
const DRIFT_THRESHOLD = 10000;
const DRIFT_COOLDOWN = 300000;
const ROUTE_COOLDOWN = 900000;

function loadCachedUtc(): number | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { utcMs, cachedAt } = JSON.parse(raw);
    if (Date.now() - cachedAt < CACHE_MAX_AGE) return utcMs;
  } catch {}
  return null;
}

function saveCachedUtc(utcMs: number) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ utcMs, cachedAt: Date.now() }));
  } catch {}
}

async function fetchJSON(url: string, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function parseTimeApiIo(data: Record<string, unknown>): number {
  const d = data as any;
  if (typeof d.gmtOffset !== 'number') throw new Error('timeapi.io: missing gmtOffset');
  const local = Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, d.seconds ?? 0, d.milliSeconds ?? 0);
  return local - d.gmtOffset * 1000;
}

function parseWorldTimeApi(data: Record<string, unknown>): number {
  const ms = Date.parse(data.datetime as string);
  if (!isNaN(ms)) return ms;
  throw new Error('worldtimeapi.org: cannot parse datetime');
}

export function VerifiedTimeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const cachedRef = useRef(loadCachedUtc());
  const cached = cachedRef.current;

  const [now, setNow] = useState<Date>(() => new Date(cached ?? Date.now()));
  const [isSynced, setIsSynced] = useState(!!cached);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(cached ? 'success' : 'syncing');

  const verifiedUtcRef = useRef(cached ?? Date.now());
  const syncTimeRef = useRef(Date.now());
  const isSyncingRef = useRef(false);
  const retryCountRef = useRef(0);
  const lastDriftSyncRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncStatusRef = useRef(syncStatus);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => { syncStatusRef.current = syncStatus; }, [syncStatus]);

  const syncWithServer = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus('syncing');

    const layers: (() => Promise<number>)[] = [
      () => fetchJSON('https://www.timeapi.io/api/Time/current/zone?timeZone=Africa/Casablanca').then(parseTimeApiIo),
      () => fetchJSON('https://worldtimeapi.org/api/timezone/Africa/Casablanca').then(parseWorldTimeApi),
      () => fetchJSON('https://www.timeapi.io/api/Time/current/zone?timeZone=UTC').then(parseTimeApiIo),
      () => fetchJSON('https://worldtimeapi.org/api/timezone/Etc/UTC').then(parseWorldTimeApi),
      async () => Date.now(),
    ];

    let success = false;
    let serverUtcMs = Date.now();

    for (let i = 0; i < layers.length; i++) {
      try {
        const t1 = Date.now();
        serverUtcMs = await layers[i]();
        const t2 = Date.now();
        const compensated = serverUtcMs + (t2 - t1) / 2;

        verifiedUtcRef.current = compensated;
        syncTimeRef.current = t2;
        saveCachedUtc(compensated);
        setSyncStatus('success');
        setIsSynced(true);
        success = true;
        break;
      } catch (err) {
        console.warn(`[Clock] Layer ${i + 1} failed:`, err);
        if (i < layers.length - 1) {
          await new Promise(r => setTimeout(r, LAYER_DELAY));
        }
      }
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    if (success) {
      retryCountRef.current = 0;
      timerRef.current = setTimeout(() => { isSyncingRef.current = false; syncWithServer(); }, INTERVAL_SUCCESS);
    } else {
      const delay = Math.min(RETRY_BASE * Math.pow(2, retryCountRef.current), RETRY_MAX);
      retryCountRef.current++;
      setSyncStatus('error');
      timerRef.current = setTimeout(() => { isSyncingRef.current = false; syncWithServer(); }, delay);
    }

    isSyncingRef.current = false;
  }, []);

  useEffect(() => {
    if (cached) {
      const id = setTimeout(syncWithServer, 1000);
      return () => clearTimeout(id);
    }
    syncWithServer();
  }, [cached, syncWithServer]);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date(verifiedUtcRef.current + (Date.now() - syncTimeRef.current)));
    }, TICK_INTERVAL);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let last = Date.now();
    const id = setInterval(() => {
      const t = Date.now();
      if (Math.abs(t - last - WATCHDOG_INTERVAL) > DRIFT_THRESHOLD && t - lastDriftSyncRef.current > DRIFT_COOLDOWN) {
        lastDriftSyncRef.current = t;
        syncWithServer();
      }
      last = t;
    }, WATCHDOG_INTERVAL);
    return () => clearInterval(id);
  }, [syncWithServer]);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      const t = Date.now();
      if (syncStatusRef.current === 'error' || t - syncTimeRef.current > ROUTE_COOLDOWN) {
        syncWithServer();
      }
    }
  }, [location.pathname, syncWithServer]);

  const value = { verifiedTime: now, isSynced, syncStatus, syncNow: syncWithServer };

  return (
    <VerifiedTimeContext.Provider value={value}>
      {children}
    </VerifiedTimeContext.Provider>
  );
}

export function useVerifiedTime() {
  const ctx = useContext(VerifiedTimeContext);
  if (!ctx) throw new Error('useVerifiedTime must be used within VerifiedTimeProvider');
  return ctx;
}
