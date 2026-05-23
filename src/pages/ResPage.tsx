import { Plus, Loader2, Edit } from 'lucide-react';
import { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import BaseModal from '../components/BaseModal';
import ReservationDetailsView from '../components/ResDetails';
import ResForm, { ReservationFormData } from '../components/ResForm';
import { PageHeader } from '../components/PageHeader';
import Section2 from '../components/Section2';
import { supabase } from '../lib/supabase';
import { FormattedReservation } from '../types';
import { RESERVATION_STATUSES } from '../constants';

const defaultFormData: ReservationFormData = {
  clientSearchQuery: '',
  clientName: '', clientId: '', clientLicense: '',
  pickupDate: '', returnDate: '', extendedReturnDate: '',
  dailyRate: 0, prepayment: 0, prepaymentType: 'fully_paid',
  depositType: '', depositAmount: 0,
  odometerOut: '', odometerIn: '', fuelOut: '', fuelIn: '',
  cleanedBefore: '', includedItems: [], notes: '',
  carBrand: '', carModel: '', licensePlate: '',
  totalPrice: 0, balanceDue: 0, duration: '',
  reservationStateLabel: '', reservationStateColor: '',
  selectedCarId: null,
  reservationStatus: '',
};

export default function Reservations() {
  const { t, i18n } = useTranslation();
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
  const [resFormData, setResFormData] = useState<ReservationFormData>(defaultFormData);
  const [resFormMode, setResFormMode] = useState<'add' | 'edit'>('add');
  const [editReservationId, setEditReservationId] = useState<string | null>(null);
  const [saveActions, setSaveActions] = useState<ReactNode>(null);
  const [isResSaving, setIsResSaving] = useState(false);

  const mapReservationToForm = (res: FormattedReservation): ReservationFormData => ({
    clientSearchQuery: res.customer_name || '',
    clientName: res.customer_name || '',
    clientId: res.customer_national_id || '',
    clientLicense: res.customer_license || '',
    pickupDate: res.start_date?.slice(0, 16) || '',
    returnDate: res.end_date?.slice(0, 16) || '',
    extendedReturnDate: res.extended_return_date?.slice(0, 16) || '',
    dailyRate: res.car?.daily_rate || 0,
    prepayment: res.prepayment || 0,
    prepaymentType: res.prepayment && res.total_price && res.prepayment >= res.total_price ? 'fully_paid' : 'amount',
    depositType: res.deposit_type || '',
    depositAmount: res.deposit_amount || 0,
    odometerOut: res.odometer_out?.toString() || '',
    odometerIn: res.odometer_in?.toString() || '',
    fuelOut: res.fuel_level_out?.toString() || '',
    fuelIn: res.fuel_level_in?.toString() || '',
    cleanedBefore: res.cleaned_before || '',
    includedItems: res.included_items || [],
    notes: res.notes || '',
    carBrand: res.car?.brand || '',
    carModel: res.car?.model || '',
    licensePlate: res.car?.plate || '',
    totalPrice: res.total_price || 0,
    balanceDue: (res.total_price || 0) - (res.prepayment || 0),
    duration: '',
    reservationStateLabel: '',
    reservationStateColor: '',
    selectedCarId: res.car_id || null,
    reservationStatus: res.status,
    vehicleStateUrls: res.vehicle_state_urls || [],
    paperContractUrls: res.paper_contract_urls || [],
  });

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
              essentials
            ),
            reservation_documents (*)
          `)
          .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const active: FormattedReservation[] = data
          .filter(r => r.status !== 'Completed' && r.status !== 'Cancelled')
          .map(r => {
            const now = new Date();
            const start = new Date(r.start_date);
            const endDate = new Date(r.end_date);
            const extEnd = r.extended_return_date ? new Date(r.extended_return_date) : null;
            const end = (extEnd && !isNaN(extEnd.getTime())) ? extEnd : endDate;

            let stateLabel = 'measuring...';
            let statusColor = 'bg-slate-200 text-slate-700';
            if (r.start_date && (r.end_date || r.extended_return_date)) {
              if (now < start) {
                stateLabel = 'Reserved';
                statusColor = 'bg-sky-400 text-white';
              } else if (now > end) {
                stateLabel = 'Overdue';
                statusColor = 'bg-red-600 text-white';
              } else {
                stateLabel = 'Active';
                statusColor = 'bg-primary text-white';
              }
            }

            return {
              ...r,
              id_short: r.id.slice(0, 8).toUpperCase(),
              client: r.customer_name,
              carName: r.car ? `${r.car.brand} ${r.car.model}` : t('common.noData'),
              carPlate: r.car?.plate || '—',
              pickup: new Date(r.start_date).toLocaleDateString(i18n.language),
              return: new Date(r.end_date).toLocaleDateString(i18n.language),
              state: stateLabel,
              statusColor,
              price: `$${parseFloat(String(r.total_price || 0)).toFixed(2)}`,
              vehicle_state_urls: (r.reservation_documents || [])
                .filter((d: any) => d.doc_type === 'vehicle_state')
                .map((d: any) => d.file_url),
              paper_contract_urls: (r.reservation_documents || [])
                .filter((d: any) => d.doc_type === 'paper_contract')
                .map((d: any) => d.file_url),
            };
          });

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
    setResFormData(mapReservationToForm(detailsReservation));
    setEditReservationId(detailsReservation.id);
    setResFormMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenResForm = () => {
    setResFormData(defaultFormData);
    setEditReservationId(null);
    setResFormMode('add');
    setIsModalOpen(true);
  };

  const handleRebook = (res: FormattedReservation) => {
    setInitialData({
      car_id: res.car_id,
      customer_name: res.customer_name,
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
              onClick={handleOpenResForm}
              className="header-btn"
            >
              <Plus className="w-4 h-4" /> {t('reservations.newReservation')}
            </button>
          }
          className="p-6 md:p-10"
        />
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setResFormData(defaultFormData);
            setEditReservationId(null);
            fetchReservations();
          }}
          title={
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-[0.2em]">
                {resFormMode === 'edit' ? t('editReservation.title', 'Edit Reservation') : t('reservations.form.title', 'New Reservation')}
              </h2>
            </div>
          }
          actions={saveActions}
          closeDisabled={isResSaving}
        >
          <ResForm
            reservation={resFormData}
            onChange={(data) => setResFormData(prev => ({ ...prev, ...data }))}
            onSaved={() => {
              setIsModalOpen(false);
              setResFormData(defaultFormData);
              setEditReservationId(null);
              fetchReservations();
            }}
            mode={resFormMode}
            editId={editReservationId}
            onActionsReady={setSaveActions}
            onSavingChange={setIsResSaving}
          />
        </BaseModal>
        <BaseModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setDetailsReservation(null);
          }}
          title="Reservation Details"
          actions={
            <button
              onClick={handleEditFromDetails}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-blue-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
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
                      <th className="py-3 px-4 font-black text-center">{t('reservations.reservationId')}</th>
                      <th className="py-3 px-4 font-black text-center">{t('reservations.customerName')}</th>
                      <th className="py-3 px-4 font-black text-center">{t('reservations.car')}</th>
                      <th className="py-3 px-4 font-black text-center">{t('reservations.startDate')}</th>
                      <th className="py-3 px-4 font-black text-center">{t('reservations.endDate')}</th>
                      <th className="py-3 px-4 font-black text-center">State</th>
                      <th className="py-3 px-4 text-center font-black">{t('reservations.totalAmount')}</th>
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
                            className="py-2.5 px-4 text-center border-e border-border-tint standard-row-text cursor-pointer hover:text-primary transition-colors font-mono tracking-tighter" 
                            data-label={t('reservations.reservationId')}
                          >
                            {row.id_short}
                          </td>
                          <td className="py-2.5 px-4 text-center border-e border-border-tint standard-row-text" data-label={t('reservations.customerName')}><span className="cursor-pointer hover:underline" onClick={() => handleOpenDetails(row)}>{row.client}</span></td>
                          <td className="py-2.5 px-4 text-center border-e border-border-tint standard-row-text" data-label={t('reservations.car')}><span className="cursor-pointer hover:underline" onClick={() => handleOpenDetails(row)}>{row.carName}</span></td>
                          <td className="py-2.5 px-4 text-center border-e border-border-tint standard-row-text font-mono tracking-tighter" data-label={t('reservations.startDate')}>{row.pickup}</td>
                          <td className="py-2.5 px-4 text-center border-e border-border-tint standard-row-text font-mono tracking-tighter" data-label={t('reservations.endDate')}>{row.return}</td>
                          <td className="py-2.5 px-4 text-center border-e border-border-tint" data-label="State">
                            <div className={`h-7 flex items-center justify-center rounded-[12px] ${row.statusColor} px-3`}>
                              <span className="text-[10px] font-black uppercase tracking-widest">{row.state}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-center standard-row-text font-mono tracking-tighter font-black" data-label={t('reservations.totalAmount')}>{row.price}</td>
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

