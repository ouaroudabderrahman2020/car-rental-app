import { RefreshCw, Search, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { SectionHeader } from '../components/SectionHeader';
import ReservationDetailsModal from '../components/ReservationDetailsModal';
import { supabase } from '../lib/supabase';
import { useStatus } from '../contexts/StatusContext';

export default function Archive() {
  const { t, i18n } = useTranslation();
  const { setStatus } = useStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [archiveData, setArchiveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchive = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          cars (
            brand,
            model
          )
        `)
        .in('status', ['Completed', 'Cancelled'])
        .order('end_date', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map(r => ({
          id: r.id.slice(0, 8).toUpperCase(),
          client: r.customer_name,
          clientType: t('common.clientTypes.regular'),
          car: r.cars ? `${r.cars.brand} ${r.cars.model}` : t('common.noData'),
          mileage: 'N/A',
          duration: `${new Date(r.start_date).toLocaleDateString(i18n.language)} - ${new Date(r.end_date).toLocaleDateString(i18n.language)}`,
          hours: 'N/A',
          price: `$${parseFloat(r.total_price).toFixed(2)}`
        }));
        setArchiveData(formatted);
      }
    } catch (error) {
      console.error('Error fetching archive:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setStatus(t('archive.syncing'), 'processing', 0);
    fetchArchive().finally(() => {
      setIsSyncing(false);
      setStatus(t('common.success'), 'success');
    });
  };

  const handleOpenDetails = (res: any) => {
    setSelectedReservation(res);
    setIsModalOpen(true);
  };

  const totalRevenue = archiveData.reduce((acc, curr) => acc + parseFloat(curr.price.replace('$', '')), 0);

  return (
    <Layout title={t('archive.title')}>
      <div className="w-full bg-white min-h-full pb-10">
        <ReservationDetailsModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            fetchArchive();
          }} 
          reservationData={selectedReservation}
        />

        <section className="py-lg">
          <div className="max-w-[1440px] mx-auto px-margin v-section-gap">
            {/* Action Toolbar */}
            <SectionHeader 
              title={t('archive.overview', 'Archive Overview')}
              actions={
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-6 py-2.5 bg-primary text-white font-black text-fluid-sm uppercase tracking-[0.2em] industrial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? t('archive.syncing') : t('archive.refresh')}</span>
                </button>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <div className="bg-white border border-slate-200 shadow-sm p-8 flex flex-col gap-2">
                <p className="font-sans text-xs text-ink/60 uppercase tracking-widest font-bold">{t('archive.revenueLabel')}</p>
                <h3 className="text-2xl font-bold text-ink">${totalRevenue.toFixed(2)}</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{t('archive.revenueSub')}</p>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm p-8 flex flex-col gap-2">
                <p className="font-sans text-xs text-ink/60 uppercase tracking-widest font-bold">{t('archive.entriesLabel')}</p>
                <h3 className="text-2xl font-bold text-ink">{archiveData.length}</h3>
                <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mt-1">{t('archive.entriesSub')}</p>
              </div>
            </div>

            <section>
              <SectionHeader 
                title={t('reservations.history')}
                badge={<span className="px-3 py-1 bg-ink text-white text-xs font-bold uppercase tracking-widest">{archiveData.length} {t('reservations.entries')}</span>}
              />

              <div className="bg-white border border-slate-200 shadow-sm overflow-hidden min-h-[200px] flex items-center justify-center">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">{t('common.loading')}</p>
                </div>
              ) : archiveData.length === 0 ? (
                <div className="py-12 text-center text-midnight/40 font-bold uppercase tracking-widest">
                  {t('common.noData')}
                </div>
              ) : (
                <table className="w-full text-left border-collapse responsive-table">
                  <thead>
                    <tr className="bg-slate-800 text-white font-sans text-xs uppercase tracking-[0.1em] border-b border-slate-800">
                      <th className="py-5 px-6 font-black text-center">{t('archive.table.id')}</th>
                      <th className="py-5 px-6 font-black text-center">{t('archive.table.client')}</th>
                      <th className="py-5 px-6 font-black text-center">{t('archive.table.car')}</th>
                      <th className="py-5 px-6 font-black text-center">{t('archive.table.duration')}</th>
                      <th className="py-5 px-6 font-black text-center">{t('archive.table.total')}</th>
                    </tr>
                  </thead>
                  <tbody className="font-sans text-ink">
                    {archiveData.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100/50 hover:bg-white transition-all">
                        <td onClick={() => handleOpenDetails(row)} className="py-6 px-6 font-bold text-ink border-e border-slate-100 text-center cursor-pointer hover:text-primary transition-colors" data-label={t('archive.table.id')}>{row.id}</td>
                        <td className="py-6 px-6 border-e border-slate-100 text-center" data-label={t('archive.table.client')}>
                          <div className="flex flex-col items-center">
                            <div className="font-semibold cursor-pointer hover:text-primary transition-colors">{row.client}</div>
                            <div className={`text-[11px] font-bold uppercase tracking-tighter ${row.clientType === t('common.clientTypes.repeat') ? 'text-primary' : 'text-ink/40'}`}>
                              {row.clientType}
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-6 border-e border-slate-100 text-center" data-label={t('archive.table.car')}>
                          <div className="flex flex-col items-center">
                            <div className="font-semibold cursor-pointer hover:text-primary transition-colors">{row.car}</div>
                            <div className="text-xs text-ink">{t('fleet.mileageDriven')}: {row.mileage}</div>
                          </div>
                        </td>
                        <td className="py-6 px-6 border-e border-slate-100 text-center" data-label={t('archive.table.duration')}>
                          <div className="flex flex-col items-center">
                            <div className="font-semibold text-accent-blue">{row.duration}</div>
                            <div className="text-xs text-ink">{row.hours}</div>
                          </div>
                        </td>
                        <td className="py-6 px-6 text-center font-bold text-ink" data-label={t('archive.table.total')}>{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            </section>
          </div>
        </section>
      </div>
    </Layout>
  );
}
