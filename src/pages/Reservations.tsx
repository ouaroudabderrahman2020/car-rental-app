import { Plus, ArrowRight, Loader2, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import ReservationModal from '../components/ReservationModal';
import BaseModal from '../components/BaseModal';
import ReservationDetailsView from '../components/ReservationDetailsView';
import { PageHeader } from '../components/PageHeader';
import Section2 from '../components/Section2';
/* removed FormSection import */
import { supabase } from '../lib/supabase';
import { Reservation, FormattedReservation } from '../types';
import { RESERVATION_STATUSES } from '../constants';
import { useStatus } from '../contexts/StatusContext';

export default function Reservations() {
  const { t, i18n } = useTranslation();
  const { setStatus } = useStatus();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<FormattedReservation | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsReservation, setDetailsReservation] = useState<FormattedReservation | null>(null);
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
              plate,
              daily_rate,
              odometer,
              starting_fuel_level,
              image_url,
              essentials
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

  const handleOpenDetails = (res: FormattedReservation) => {
    setDetailsReservation(res);
    setIsDetailsOpen(true);
  };

  const handleEditFromDetails = () => {
    if (!detailsReservation) return;
    setIsDetailsOpen(false);
    setSelectedReservation(detailsReservation);
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
      daily_rate: res.car?.daily_rate || 0,
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
    <Layout>
      <div className="w-full bg-white">
        <PageHeader 
          title={t('nav.reservations')}
          actions={
            <button 
              onClick={() => {
                setModalMode('add');
                setIsModalOpen(true);
              }}
              className="header-btn"
            >
              <Plus className="w-4 h-4" /> {t('reservations.newReservation')}
            </button>
          }
          className="p-6 md:p-10"
        />
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
        <BaseModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setDetailsReservation(null);
          }}
          title={
            <div className="flex justify-between items-center w-full pr-8">
              <div className="flex items-center gap-3">
                <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-[0.2em]">
                  Reservation Details
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEditFromDetails}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-blue-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>
            </div>
          }
        >
          {detailsReservation && <ReservationDetailsView reservation={detailsReservation} />}
        </BaseModal>

        <div className="max-w-[1440px] mx-auto pt-6 pb-12">
          <Section2>
            <div className="w-full flex flex-col gap-6">
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
                        <td colSpan={7} className="empty-table-cell">
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
          </Section2>
        </div>
      </div>
    </Layout>
  );
}

