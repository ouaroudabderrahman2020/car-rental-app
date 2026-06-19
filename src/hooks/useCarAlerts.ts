import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useVerifiedTime } from '../hooks/useVerifiedTime';
import { CarAlert, CarAlertType } from '../types';

const READ_LS_KEY = 'car_alerts_read';
const DISMISS_LS_KEY = 'car_alerts_dismissed';
const ALERT_WINDOW_DAYS = 7;
const REFETCH_COOLDOWN = 60000;

const ALERT_LABELS: Record<string, string> = {
  registration_expiry: 'Registration',
  insurance_expiry: 'Insurance',
  vignette_expiry: 'Vignette',
  maintenance: 'Maintenance',
};

interface MaintenanceInterval {
  id: string;
  type: string;
  value: string;
  lastCompleted: string | null;
}

interface CarRow {
  id: string;
  brand: string;
  model: string;
  plate: string;
  registration_expiry: string | null;
  insurance_expiry: string | null;
  vignette_expiry: string | null;
  intervals: MaintenanceInterval[] | null;
}

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSet(ids: Set<string>, key: string) {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {}
}

function getCasablancaDate(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' });
}

function daysBetween(fromDate: string, toDate: string): number {
  const f = new Date(fromDate + 'T00:00:00');
  const t = new Date(toDate + 'T00:00:00');
  return Math.round((t.getTime() - f.getTime()) / 86400000);
}

export function useCarAlerts() {
  const location = useLocation();
  const { verifiedTime } = useVerifiedTime();
  const todayRef = useRef(getCasablancaDate(verifiedTime));

  useEffect(() => {
    todayRef.current = getCasablancaDate(verifiedTime);
  }, [verifiedTime]);

  const [alerts, setAlerts] = useState<CarAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(0);
  const readSetRef = useRef(loadSet(READ_LS_KEY));
  const dismissedSetRef = useRef(loadSet(DISMISS_LS_KEY));

  const compute = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < REFETCH_COOLDOWN) return;
    lastFetchRef.current = now;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, brand, model, plate, registration_expiry, insurance_expiry, vignette_expiry, intervals');

      if (error) throw error;
      if (!data) {
        setAlerts([]);
        return;
      }

      const today = todayRef.current;
      const readSet = readSetRef.current;
      const dismissedSet = dismissedSetRef.current;
      const result: CarAlert[] = [];

      for (const car of data as CarRow[]) {
        const carName = `${car.brand} ${car.model}`;

        const expiryFields: { key: CarAlertType; val: string | null }[] = [
          { key: 'registration_expiry', val: car.registration_expiry },
          { key: 'insurance_expiry', val: car.insurance_expiry },
          { key: 'vignette_expiry', val: car.vignette_expiry },
        ];

        for (const { key, val } of expiryFields) {
          if (!val) continue;
          const days = daysBetween(today, val);
          if (days > ALERT_WINDOW_DAYS) continue;
          const id = `${car.id}_${key}`;
          if (dismissedSet.has(id)) continue;
          result.push({
            id,
            carId: car.id,
            carName,
            carPlate: car.plate,
            type: key,
            dueDate: val,
            daysRemaining: days,
            read: readSet.has(id),
          });
        }

        if (car.intervals) {
          for (const interval of car.intervals) {
            if (!interval.lastCompleted) continue;
            const valueNum = parseInt(interval.value);
            if (isNaN(valueNum) || valueNum <= 0) continue;
            const daysToAdd = valueNum <= 12 ? valueNum * 30 : Math.min(valueNum, 730);
            const nextDue = new Date(new Date(interval.lastCompleted + 'T00:00:00').getTime() + daysToAdd * 86400000);
            const nextDueStr = nextDue.toISOString().slice(0, 10);
            const days = daysBetween(today, nextDueStr);
            if (days > ALERT_WINDOW_DAYS) continue;
            const id = `${car.id}_maint_${interval.id.replace(/\s+/g, '_')}`;
            if (dismissedSet.has(id)) continue;
            result.push({
              id,
              carId: car.id,
              carName,
              carPlate: car.plate,
              type: 'maintenance',
              dueDate: nextDueStr,
              daysRemaining: days,
              read: readSet.has(id),
              serviceName: interval.type,
            });
          }
        }
      }

      result.sort((a, b) => a.daysRemaining - b.daysRemaining);
      setAlerts(result);
    } catch (err) {
      console.warn('[CarAlerts] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    compute();
  }, [compute]);

  useEffect(() => {
    compute();
  }, [location.pathname, compute]);

  const markRead = useCallback((id: string) => {
    readSetRef.current.add(id);
    saveSet(readSetRef.current, READ_LS_KEY);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  const markAllRead = useCallback(() => {
    const ids = new Set<string>();
    for (const a of alerts) ids.add(a.id);
    for (const id of ids) readSetRef.current.add(id);
    saveSet(readSetRef.current, READ_LS_KEY);
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  }, [alerts]);

  const dismissAlert = useCallback((id: string) => {
    dismissedSetRef.current.add(id);
    saveSet(dismissedSetRef.current, DISMISS_LS_KEY);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const unreadCount = alerts.filter(a => !a.read).length;

  return { alerts, unreadCount, loading, markRead, markAllRead, dismissAlert, refresh: compute, labels: ALERT_LABELS };
}
