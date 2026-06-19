import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { useCarAlerts } from '../hooks/useCarAlerts';
import { supabase } from '../lib/supabase';
import BaseModal from '../components/BaseModal';
import Cardetails from '../components/CarDetails';
import { CarAlert, Car, FormattedCar } from '../types';

const URGENCY_STYLES = {
  overdue: { dot: 'bg-red-500', label: 'text-red-600', bg: 'bg-red-50' },
  critical: { dot: 'bg-orange-500', label: 'text-orange-600', bg: 'bg-orange-50' },
  upcoming: { dot: 'bg-yellow-500', label: 'text-yellow-700', bg: 'bg-yellow-50' },
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { timeZone: 'Africa/Casablanca' });
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { alerts, loading, markRead, markAllRead, dismissAlert, refresh } = useCarAlerts();
  const [detailsCar, setDetailsCar] = useState<FormattedCar | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [carLoading, setCarLoading] = useState(false);

  const fetchCarData = async (carId: string) => {
    setCarLoading(true);
    try {
      const { data, error } = await supabase.from('cars').select('*').eq('id', carId).single();
      if (error) throw error;
      setDetailsCar(data as unknown as FormattedCar);
      setDetailsOpen(true);
    } catch (err) {
      console.error('Error fetching car:', err);
    } finally {
      setCarLoading(false);
    }
  };

  const handleClick = (alert: CarAlert) => {
    markRead(alert.id);
    fetchCarData(alert.carId);
  };

  const overdue = alerts.filter(a => a.daysRemaining <= 0);
  const critical = alerts.filter(a => a.daysRemaining >= 1 && a.daysRemaining <= 3);
  const upcoming = alerts.filter(a => a.daysRemaining >= 4 && a.daysRemaining <= 7);

  const sections = [
    { title: `Overdue (${overdue.length})`, items: overdue, urgency: 'overdue' as const },
    { title: `Critical (${critical.length})`, items: critical, urgency: 'critical' as const },
    { title: `Upcoming (${upcoming.length})`, items: upcoming, urgency: 'upcoming' as const },
  ];

  return (
    <Layout title={t('notifications.title', 'Notifications')}>
      <PageHeader
        title={t('notifications.title', 'Notifications')}
        actions={
          alerts.length > 0 ? (
            <button
              onClick={markAllRead}
              className="px-4 py-2 bg-midnight-ink text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        {loading && alerts.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-400 font-medium">
            Loading alerts...
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              All caught up — no alerts
            </p>
          </div>
        )}

        {sections.map(section => {
          if (section.items.length === 0) return null;
          const style = URGENCY_STYLES[section.urgency];
          return (
            <div key={section.title} className="bg-white border border-slate-200 rounded-[12px] overflow-hidden shadow-sm">
              <div className={`px-4 py-2.5 ${style.bg} border-b border-slate-200`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${style.label}`}>
                  {section.title}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {section.items.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-center group"
                  >
                    <div
                      onClick={() => handleClick(alert)}
                      className="flex-1 flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50 cursor-pointer"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                      <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4 items-start sm:items-center">
                        <div className="sm:col-span-2">
                          <div className={`text-sm ${alert.read ? 'font-normal' : 'font-bold'} text-slate-800 truncate`}>
                            {alert.carName}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {alert.carPlate}
                          </div>
                        </div>
                        <div className={`text-xs ${alert.read ? 'font-normal' : 'font-semibold'} text-slate-500`}>
                          {getAlertLabel(alert)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDate(alert.dueDate)}
                        </div>
                      </div>
                      <span className={`text-xs font-black whitespace-nowrap shrink-0 ${style.label}`}>
                        {getDaysText(alert.daysRemaining)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
                      className="shrink-0 p-1.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <BaseModal
        isOpen={detailsOpen}
        onClose={() => { setDetailsOpen(false); setDetailsCar(null); }}
        title={detailsCar ? `${detailsCar.brand} ${detailsCar.model}` : 'Car Details'}
      >
        {carLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-400 font-medium">
            Loading car details...
          </div>
        ) : (
          detailsCar && <Cardetails car={detailsCar} />
        )}
      </BaseModal>
    </Layout>
  );
}
