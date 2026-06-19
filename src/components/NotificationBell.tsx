import React, { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useCarAlerts } from '../hooks/useCarAlerts';
import { CarAlert } from '../types';

const URGENCY_COLORS: Record<string, string> = {
  overdue: 'bg-red-500',
  critical: 'bg-orange-500',
  upcoming: 'bg-yellow-500',
};

function getUrgency(days: number): 'overdue' | 'critical' | 'upcoming' {
  if (days <= 0) return 'overdue';
  if (days <= 3) return 'critical';
  return 'upcoming';
}

function getAlertLabel(alert: CarAlert): string {
  if (alert.type === 'maintenance') return alert.serviceName || 'Maintenance';
  const labels: Record<string, string> = {
    registration_expiry: 'Registration',
    insurance_expiry: 'Insurance',
    vignette_expiry: 'Vignette',
  };
  return labels[alert.type] || alert.type;
}

function getDaysText(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { alerts, unreadCount, markRead, dismissAlert } = useCarAlerts();

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const topAlerts = alerts.slice(0, 10);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center gap-1 p-1.5 hover:bg-ink/5 rounded-none transition-all border border-transparent hover:border-ink/10"
      >
        <Bell className="w-4 h-4 md:w-5 md:h-5 text-ink" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-bold rounded-full leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute end-0 top-full pt-2 z-[70]"
          >
            <div className="bg-white text-midnight shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border-2 border-midnight min-w-[280px] max-w-[320px] py-1 max-h-[80vh] flex flex-col">
              <div className="px-4 py-2 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} new alert${unreadCount > 1 ? 's' : ''}` : 'No new alerts'}
                </span>
              </div>

              <div className="overflow-y-auto flex-1">
                {topAlerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    All caught up
                  </div>
                ) : (
                  topAlerts.map(alert => {
                    const urgency = getUrgency(alert.daysRemaining);
                    return (
                      <div
                        key={alert.id}
                        className="flex items-center gap-1 group"
                      >
                        <button
                          onClick={() => { markRead(alert.id); }}
                          className="flex-1 text-start flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50"
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${URGENCY_COLORS[urgency]}`} />
                          <div className="min-w-0 flex-1">
                            <div className={`text-[11px] ${alert.read ? 'font-medium' : 'font-bold'} text-slate-800 truncate leading-tight`}>
                              {alert.carName}
                            </div>
                            <div className={`text-[9px] ${alert.read ? 'font-normal' : 'font-semibold'} text-slate-500 uppercase tracking-wider leading-tight mt-0.5`}>
                              {getAlertLabel(alert)}
                            </div>
                          </div>
                          <span className={`text-[10px] font-black whitespace-nowrap shrink-0 ${
                            urgency === 'overdue' ? 'text-red-600' :
                            urgency === 'critical' ? 'text-orange-600' :
                            'text-yellow-700'
                          }`}>
                            {getDaysText(alert.daysRemaining)}
                          </span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
                          className="shrink-0 p-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => { setOpen(false); navigate('/notifications'); }}
                className="w-full text-center px-4 py-2.5 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-colors"
              >
                See all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
