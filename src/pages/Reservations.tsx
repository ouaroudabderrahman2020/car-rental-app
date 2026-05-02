import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { SectionHeader } from '../components/SectionHeader';
import ReservationModal from '../components/ReservationModal';
import FormSection from '../components/FormSection';
import { supabase } from '../lib/supabase';
import { Reservation, FormattedReservation } from '../types';
import { RESERVATION_STATUSES } from '../constants';
import { useStatus } from '../contexts/StatusContext';

export default function Reservations() {
  const { t, i18n } = useTranslation();
  const { setStatus } = useStatus();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<FormattedReservation | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [activeReservations, setActiveReservations] = useState<FormattedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchReservations = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            car:cars (
              brand,
              model,
              plate
            )
          `)
          .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const active: FormattedReservation[] = data
          .filter(r => r.status !== 'Completed' && r.status !== 'Cancelled')
          .map(r => ({
            ...r,
            id_short: r.id.slice(0, 8).toUpperCase(),
            client: r.customer_name,
            carName: r.car ? `${r.car.brand} ${r.car.model}` : t('common.noData'),
            carPlate: r.car?.plate || '—',
            pickup: new Date(r.start_date).toLocaleDateString(i18n.language),
            return: new Date(r.end_date).toLocaleDateString(i18n.language),
            state: t(`reservations.${r.status.toLowerCase()}`, r.status),
            price: `$${parseFloat(String(r.total_price || 0)).toFixed(2)}`,
            statusColor: r.status === 'Confirmed' ? 'bg-primary/10 text-primary' : 
                         r.status === 'In Progress' ? 'bg-accent-blue/10 text-accent-blue' :
                         'bg-overdue-red/10 text-overdue-red'
          }));

        setActiveReservations(active);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActive = activeReservations.filter(res => {
    const matchesSearch = res.client.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.carName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.id_short.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.carPlate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchReservations();
  }, [i18n.language]);

  const handleOpenEdit = (res: FormattedReservation) => {
    setSelectedReservation(res);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDetails = (res: FormattedReservation) => {
    setSelectedReservation(res);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleRebook = (res: FormattedReservation) => {
    setInitialData({
      car_id: res.car_id,
      customer_name: res.customer_name,
      customer_phone: res.customer_phone,
      carBrand: res.car?.brand,
      carModel: res.car?.model,
      carPlate: res.car?.plate,
      daily_rate: res.total_price / 3, // Mock fallback or get from car
      prepayment: 0,
      deposit_type: res.deposit_type,
      deposit_amount: res.deposit_amount,
      rating: res.rating,
      notes: res.notes
    });
    setModalMode('add');
    setIsModalOpen(true);
  };

  return (
    <Layout title={t('nav.reservations')}>
      <div className="w-full bg-white">
        <ReservationModal 
          isOpen={isModalOpen} 
          mode={modalMode}
          onClose={() => {
            setIsModalOpen(false);
            setInitialData(null);
            setSelectedReservation(null);
            fetchReservations();
          }} 
          reservationData={selectedReservation}
          initialData={initialData}
        />

        <div className="v-section-gap">
          {/* Section: Active Reservations */}
          <div className="py-lg bg-white">
            <div className="max-w-[1440px] mx-auto">
              <FormSection title={t('reservations.activeTitle')}>
                <div className="w-full flex flex-col gap-6">
                  {/* Action Toolbar */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="px-3 py-1 bg-primary text-white text-fluid-sm font-bold uppercase tracking-widest whitespace-nowrap">
                        {filteredActive.length} {t('reservations.activeCount')}
                      </span>
                      {/* Search Bar */}
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
                      {/* Status Filter */}
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 text-ink text-sm outline-none focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="all">{t('common.allStatus', 'All Status')}</option>
                        {RESERVATION_STATUSES.map(st => (
                          <option key={st} value={st}>
                            {t(`reservations.${st.toLowerCase().replace(' ', '_')}`, st)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <button 
                        onClick={() => {
                          setModalMode('add');
                          setIsModalOpen(true);
                        }}
                        className="px-6 py-2.5 bg-primary text-white font-black text-fluid-sm uppercase tracking-[0.2em] rounded-none industrial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> {t('reservations.newReservation')}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden min-h-[200px]">
                    <table className="w-full text-left border-collapse responsive-table">
                      <thead>
                        <tr className="bg-slate-800 text-white font-sans text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-800">
                          <th className="py-5 px-6 font-black text-center">{t('reservations.reservationId')}</th>
                          <th className="py-5 px-6 font-black text-center">{t('reservations.customerName')}</th>
                          <th className="py-5 px-6 font-black text-center">{t('reservations.car')}</th>
                          <th className="py-5 px-6 font-black text-center">{t('reservations.startDate')}</th>
                          <th className="py-5 px-6 font-black text-center">{t('reservations.endDate')}</th>
                          <th className="py-5 px-6 font-black text-center">{t('common.status')}</th>
                          <th className="py-5 px-6 text-center font-black">{t('reservations.totalAmount')}</th>
                        </tr>
                      </thead>
                      <tbody className="font-sans text-midnight leading-[1.6]">
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="py-12">
                              <div className="flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">{t('common.loading')}</p>
                              </div>
                            </td>
                          </tr>
                        ) : filteredActive.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-midnight/40 font-bold uppercase tracking-widest">
                              {t('common.noData')}
                            </td>
                          </tr>
                        ) : (
                          filteredActive.map((row) => (
                            <tr key={row.id} className="border-b hover:bg-white transition-all border-border-tint">
                              <td 
                                onClick={() => handleOpenDetails(row)}
                                className="py-6 px-6 text-center border-e border-border-tint standard-row-text cursor-pointer hover:text-primary transition-colors font-mono tracking-tighter" 
                                data-label={t('reservations.reservationId')}
                              >
                                {row.id_short}
                              </td>
                              <td className="py-6 px-6 text-center border-e border-border-tint standard-row-text" data-label={t('reservations.customerName')}><span className="cursor-pointer hover:underline" onClick={() => handleOpenDetails(row)}>{row.client}</span></td>
                              <td className="py-6 px-6 text-center border-e border-border-tint standard-row-text" data-label={t('reservations.car')}><span className="cursor-pointer hover:underline" onClick={() => handleOpenDetails(row)}>{row.carName}</span></td>
                              <td className="py-6 px-6 text-center border-e border-border-tint standard-row-text font-mono tracking-tighter" data-label={t('reservations.startDate')}>{row.pickup}</td>
                              <td className="py-6 px-6 text-center border-e border-border-tint standard-row-text font-mono tracking-tighter" data-label={t('reservations.endDate')}>{row.return}</td>
                              <td className="py-6 px-6 text-center border-e border-border-tint" data-label={t('common.status')}>
                                <span className={`px-2 py-1 ${row.statusColor} text-fluid-sm font-black uppercase tracking-tighter inline-block`}>{row.state}</span>
                              </td>
                              <td className="py-6 px-6 text-center standard-row-text font-mono tracking-tighter font-black" data-label={t('reservations.totalAmount')}>{row.price}</td>
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
        </div>

      </div>
    </Layout>
);
}

