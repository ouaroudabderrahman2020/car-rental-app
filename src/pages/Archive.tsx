import { RefreshCw, Search, ArrowRight, Loader2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { SectionHeader } from '../components/SectionHeader';
import ReservationModal from '../components/ReservationModal';
import FormSection from '../components/FormSection';
import { supabase } from '../lib/supabase';
import { useStatus } from '../contexts/StatusContext';
import { gasService } from '../lib/gas';

export default function Archive() {
  const { t, i18n } = useTranslation();
  const { setStatus } = useStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [archiveData, setArchiveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchArchive = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          car:cars (
            brand,
            model,
            plate,
            odometer,
            daily_rate
          )
        `)
        .in('status', ['Completed', 'Cancelled'])
        .order('end_date', { ascending: false });

      if (error) throw error;

      if (data) {
        setArchiveData(data);
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

  const handleExport = async () => {
    setIsExporting(true);
    setStatus(t('common.loading', 'EXPORTING...'), 'processing', 0);
    
    // Convert to headers + rows
    const headers = [
      t('reservations.reservationId'),
      t('reservations.customerName'),
      t('reservations.car'),
      t('fleet.form.plate'),
      t('reservations.startDate'),
      t('reservations.endDate'),
      t('common.status'),
      t('reservations.totalAmount')
    ];
    
    const rows = filteredData.map(res => [
      res.id.slice(0,8),
      res.customer_name,
      res.car?.brand ? `${res.car.brand} ${res.car.model}` : t('common.unknown'),
      res.car?.plate || t('common.unknown'),
      new Date(res.start_date).toLocaleDateString(i18n.language),
      new Date(res.end_date).toLocaleDateString(i18n.language),
      t(`reservations.${res.status.toLowerCase().replace(' ', '_')}`, res.status),
      res.total_price
    ]);

    const { status } = await gasService.exportData('Archive', rows);
    if (status !== 'success') {
      setStatus(t('common.exportError'), 'error');
    } else {
      setStatus(t('common.exportSuccess'), 'success');
    }
    setIsExporting(false);
  };

  const handleOpenDetails = (res: any) => {
    setSelectedReservation(res);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleRebook = (res: any) => {
    setInitialData({
      car_id: res.car_id,
      customer_name: res.customer_name,
      customer_phone: res.customer_phone,
      carBrand: res.car?.brand,
      carModel: res.car?.model,
      carPlate: res.car?.plate,
      daily_rate: res.daily_rate || res.car?.daily_rate,
      prepayment: 0,
      deposit_type: res.deposit_type,
      deposit_amount: res.deposit_amount,
      rating: res.rating,
      notes: res.notes
    });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const filteredData = archiveData.filter(res => {
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = 
      res.customer_name.toLowerCase().includes(searchStr) ||
      (res.car?.brand + ' ' + res.car?.model).toLowerCase().includes(searchStr) ||
      res.id.toLowerCase().includes(searchStr) ||
      (res.car?.plate || '').toLowerCase().includes(searchStr);
    return matchesSearch;
  });

  const totalRevenue = archiveData.reduce((acc, curr) => acc + (parseFloat(curr.total_price) || 0), 0);

  return (
    <Layout title={t('archive.title')}>
      <div className="w-full bg-white min-h-full pb-10">
        <ReservationModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setInitialData(null);
            setSelectedReservation(null);
            fetchArchive();
          }} 
          mode={modalMode}
          reservationData={selectedReservation}
          initialData={initialData}
        />

        <div className="py-lg">
          <div className="max-w-[1440px] mx-auto">
            <FormSection title={t('archive.overview', 'Archive Overview')}>
              <div className="w-full flex flex-col gap-8">
                {/* Action Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="px-6 py-2.5 bg-primary text-white font-black text-fluid-sm uppercase tracking-[0.2em] industrial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? t('archive.syncing') : t('archive.refresh')}</span>
                    </button>
                    <button 
                      onClick={handleExport}
                      disabled={isExporting}
                      className="px-6 py-2.5 bg-midnight-ink text-white font-bold text-fluid-sm uppercase tracking-widest industrial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {isExporting ? t('common.loading', 'EXPORTING...') : t('common.export', 'EXPORT TO SHEETS')}
                    </button>
                  </div>

                  <div className="relative group min-w-[200px] md:min-w-[300px]">
                    <input 
                      type="text" 
                      placeholder={t('common.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-ink text-sm focus:bg-white focus:border-primary transition-all outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                  </div>
                </div>

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
              </div>
            </FormSection>
          </div>
        </div>

            <div className="py-10">
              <FormSection title={t('reservations.history')}>
                <div className="w-full flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-ink text-white text-xs font-bold uppercase tracking-widest">
                      {filteredData.length} {t('reservations.entries')}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden min-h-[200px]">
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
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="py-12">
                              <div className="flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">{t('common.loading')}</p>
                              </div>
                            </td>
                          </tr>
                        ) : filteredData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-midnight/40 font-bold uppercase tracking-widest">
                              {t('common.noData')}
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((row) => (
                            <tr key={row.id} className="border-b border-slate-100/50 hover:bg-white transition-all">
                              <td onClick={() => handleOpenDetails(row)} className="py-6 px-6 font-bold text-ink border-e border-slate-100 text-center cursor-pointer hover:text-primary transition-colors font-mono tracking-tighter" data-label={t('archive.table.id')}>{row.id.slice(0, 8).toUpperCase()}</td>
                              <td className="py-6 px-6 border-e border-slate-100 text-center" data-label={t('archive.table.client')}>
                                <div className="flex flex-col items-center">
                                  <div className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => handleOpenDetails(row)}>{row.customer_name}</div>
                                  <div className={`text-[11px] font-bold uppercase tracking-tighter text-ink/40`}>
                                    {t('common.clientTypes.regular')}
                                  </div>
                                </div>
                              </td>
                              <td className="py-6 px-6 border-e border-slate-100 text-center" data-label={t('archive.table.car')}>
                                <div className="flex flex-col items-center">
                                  <div className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => handleOpenDetails(row)}>{row.car ? `${row.car.brand} ${row.car.model}` : t('common.noData')}</div>
                                  <div className="text-xs text-ink font-mono tracking-tighter">{row.car?.plate || '—'}</div>
                                </div>
                              </td>
                              <td className="py-6 px-6 border-e border-slate-100 text-center" data-label={t('archive.table.duration')}>
                                <div className="flex flex-col items-center">
                                  <div className="font-semibold text-accent-blue font-mono tracking-tighter text-xs">
                                    {new Date(row.start_date).toLocaleDateString(i18n.language)} - {new Date(row.end_date).toLocaleDateString(i18n.language)}
                                  </div>
                                  <div className="text-[10px] text-ink/50 uppercase tracking-widest font-bold">
                                    {row.odometer_in ? `${row.odometer_in - (row.odometer_out || 0)} KM` : '—'}
                                  </div>
                                </div>
                              </td>
                              <td className="py-6 px-6 text-center font-bold text-ink font-mono tracking-tighter" data-label={t('archive.table.total')}>${parseFloat(row.total_price || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </FormSection>
            </div>
      </div>
    </Layout>
  );
}
