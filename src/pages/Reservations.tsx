import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Loader2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { SectionHeader } from '../components/SectionHeader';
import AddReservationModal from '../components/AddReservationModal';
import EditReservationModal from '../components/EditReservationModal';
import ReservationDetailsModal from '../components/ReservationDetailsModal';
import FormSection from '../components/FormSection';
import { supabase } from '../lib/supabase';
import { gasService } from '../services/gasService';
import { Reservation } from '../types';

interface FormattedReservation extends Reservation {
  id_short: string;
  client: string;
  carName: string;
  carPlate: string;
  pickup: string;
  return: string;
  state: string;
  price: string;
  statusColor?: string;
  clientType?: string;
  mileage?: string;
  durationString?: string;
  hours?: string;
}

export default function Reservations() {
  const { t, i18n } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<FormattedReservation | null>(null);
  const [activeReservations, setActiveReservations] = useState<FormattedReservation[]>([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState<FormattedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          cars (
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
            carName: r.cars ? `${r.cars.brand} ${r.cars.model}` : t('common.noData'),
            carPlate: r.cars?.plate || '—',
            pickup: new Date(r.start_date).toLocaleDateString(i18n.language),
            return: new Date(r.end_date).toLocaleDateString(i18n.language),
            state: t(`reservations.${r.status.toLowerCase()}`, r.status),
            price: `$${parseFloat(String(r.total_price || 0)).toFixed(2)}`,
            statusColor: r.status === 'Confirmed' ? 'bg-primary/10 text-primary' : 
                         r.status === 'In Progress' ? 'bg-accent-blue/10 text-accent-blue' :
                         'bg-overdue-red/10 text-overdue-red'
          }));

        const completed: FormattedReservation[] = data
          .filter(r => r.status === 'Completed')
          .map(r => ({
            ...r,
            id_short: r.id.slice(0, 8).toUpperCase(),
            client: r.customer_name,
            clientType: t('common.clientTypes.regular'),
            carName: r.cars ? `${r.cars.brand} ${r.cars.model}` : t('common.noData'),
            carPlate: r.cars?.plate || '—',
            mileage: 'N/A',
            durationString: `${new Date(r.start_date).toLocaleDateString(i18n.language)} - ${new Date(r.end_date).toLocaleDateString(i18n.language)}`,
            hours: 'N/A',
            pickup: new Date(r.start_date).toLocaleDateString(i18n.language),
            return: new Date(r.end_date).toLocaleDateString(i18n.language),
            state: t('reservations.completed'),
            price: `$${parseFloat(String(r.total_price || 0)).toFixed(2)}`
          }));

        setActiveReservations(active);
        setRecentlyCompleted(completed);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const allData = [...activeReservations, ...recentlyCompleted];
    const rows = allData.map(res => [
      res.id_short,
      res.client,
      res.carName,
      res.carPlate,
      res.pickup,
      res.return,
      res.state,
      res.price
    ]);
    const { success, error } = await gasService.exportData('Reservations_Full_Export', rows);

    if (!success) {
      alert(`${t('common.exportError')}: ${error}`);
    } else {
      alert(t('common.exportSuccess'));
    }
    setIsExporting(false);
  };

  useEffect(() => {
    fetchReservations();
  }, [i18n.language]);

  const handleOpenEdit = (res: FormattedReservation) => {
    setSelectedReservation(res);
    setIsEditModalOpen(true);
  };

  const handleOpenDetails = (res: FormattedReservation) => {
    setSelectedReservation(res);
    setIsDetailsModalOpen(true);
  };

  return (
    <Layout title={t('nav.reservations')}>
      <div className="w-full bg-white">
        <AddReservationModal 
          isOpen={isAddModalOpen} 
          onClose={() => {
            setIsAddModalOpen(false);
            fetchReservations();
          }} 
        />

        {selectedReservation && (
          <EditReservationModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              fetchReservations();
            }}
            reservationData={selectedReservation}
          />
        )}

        {selectedReservation && (
          <ReservationDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              fetchReservations();
            }}
            reservationData={selectedReservation}
          />
        )}

        <div className="v-section-gap">
          {/* Section: Active Reservations */}
          <div className="py-lg bg-white">
            <div className="max-w-[1440px] mx-auto">
              <FormSection title={t('reservations.activeTitle')}>
                <div className="w-full flex flex-col gap-6">
                  {/* Action Toolbar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <span className="px-3 py-1 bg-primary text-white text-fluid-sm font-bold uppercase tracking-widest whitespace-nowrap">
                      {activeReservations.length} {t('reservations.activeCount')}
                    </span>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-6 py-2.5 bg-midnight-ink text-white font-bold text-fluid-sm uppercase tracking-widest rounded-none industrial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 border border-white/10 disabled:opacity-50"
                      >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isExporting ? t('common.loading') : t('common.export', 'EXPORT TO SHEETS')}
                      </button>
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
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
                        ) : activeReservations.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-midnight/40 font-bold uppercase tracking-widest">
                              {t('common.noData')}
                            </td>
                          </tr>
                        ) : (
                          activeReservations.map((row) => (
                            <tr key={row.id} className="border-b hover:bg-white transition-all border-border-tint">
                              <td 
                                onClick={() => handleOpenEdit(row)}
                                className="py-6 px-6 text-center border-e border-border-tint standard-row-text cursor-pointer hover:text-primary transition-colors" 
                                data-label={t('reservations.reservationId')}
                              >
                                {row.id_short}
                              </td>
                              <td className="py-6 px-6 text-center border-e border-border-tint standard-row-text" data-label={t('reservations.customerName')}><span className="cursor-pointer hover:underline" onClick={() => handleOpenEdit(row)}>{row.client}</span></td>
                              <td className="py-6 px-6 text-center border-e border-border-tint standard-row-text" data-label={t('reservations.car')}><span className="cursor-pointer hover:underline" onClick={() => handleOpenEdit(row)}>{row.carName}</span></td>
                              <td className="py-6 px-6 text-center border-e border-border-tint standard-row-text" data-label={t('reservations.startDate')}>{row.pickup}</td>
                              <td className="py-6 px-6 text-center border-e border-border-tint standard-row-text" data-label={t('reservations.endDate')}>{row.return}</td>
                              <td className="py-6 px-6 text-center border-e border-border-tint" data-label={t('common.status')}>
                                <span className={`px-2 py-1 ${row.statusColor} text-fluid-sm font-black uppercase tracking-tighter inline-block`}>{row.state}</span>
                              </td>
                              <td className="py-6 px-6 text-center standard-row-text" data-label={t('reservations.totalAmount')}>{row.price}</td>
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

