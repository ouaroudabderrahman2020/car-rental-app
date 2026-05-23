import { useTranslation } from 'react-i18next';
import { User, Search, Car as CarIcon, CreditCard, FileText, Monitor, ExternalLink } from 'lucide-react';
import { FormattedReservation, Car } from '../types';

interface ReservationDetailsViewProps {
  reservation: FormattedReservation;
}

export default function ReservationDetailsView({ reservation }: ReservationDetailsViewProps) {
  const { t } = useTranslation();
  const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString() : '---');
  const carInfo = (reservation.car || {}) as Partial<Car>;
  const rate = carInfo.daily_rate || 0;
  const prepay = reservation.prepayment || 0;
  const total = reservation.total_price != null ? reservation.total_price : (Number(rate) * 1);

  const getReservationState = () => {
    const now = new Date();
    const start = new Date(reservation.start_date);
    const end = new Date(reservation.end_date);
    if (!reservation.start_date || !reservation.end_date) return '---';
    const extEnd = reservation.extended_return_date ? new Date(reservation.extended_return_date) : null;
    const effectiveEnd = (extEnd && !isNaN(extEnd.getTime())) ? extEnd : end;
    if (now < start) return 'Reserved';
    if (now > effectiveEnd) return 'Overdue';
    return 'Active';
  };

  const sections = [
    {
      title: `1 ${t('reservations.form.client', 'Client')}`,
      icon: <User className="w-4 h-4" />,
      fields: [
        { label: t('reservations.form.fullName', 'Name'), value: reservation.customer_name || reservation.client },
        { label: t('reservations.form.idCardNumber', 'ID Card'), value: reservation.customer_national_id },
        { label: t('reservations.form.licenseNumber', 'License'), value: reservation.customer_license },
      ],
    },
    {
      title: `2 ${t('reservations.form.schedule', 'Schedule')}`,
      icon: <Search className="w-4 h-4" />,
      fields: [
        { label: t('reservations.form.carSelection', 'Car'), value: `${carInfo.brand || ''} ${carInfo.model || ''}`.trim() || reservation.carName },
        { label: t('reservations.form.licensePlate', 'Plate'), value: reservation.carPlate || carInfo.plate },
        { label: t('reservations.form.pickupDate', 'Pick-up'), value: formatDate(reservation.start_date) },
        { label: t('reservations.form.returnDate', 'Return'), value: formatDate(reservation.end_date) },
        { label: t('reservations.form.extendedReturn', 'Extended Return'), value: formatDate(reservation.extended_return_date) },
        {
          label: t('reservations.form.duration', 'Duration'),
          value: (() => {
            const start = new Date(reservation.start_date);
            const end = new Date(reservation.end_date);
            if (!reservation.start_date || !reservation.end_date || end <= start) return '---';
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return `${Math.floor(hours / 24)}d ${Math.floor(hours % 24)}h`;
          })(),
        },
        { label: t('reservations.form.state', 'Reservation State'), value: getReservationState() },
      ],
    },
    {
      title: `3 ${t('reservations.form.billing', 'Billing')}`,
      icon: <CreditCard className="w-4 h-4" />,
      fields: [
        { label: t('reservations.form.dailyRate', 'Daily Rate'), value: `${rate} DH` },
        { label: t('reservations.form.totalPriceCalc', 'Total Price'), value: `${Number(total).toFixed(2)} DH` },
        { label: t('reservations.form.prepayment', 'Prepayment'), value: `${Number(prepay).toFixed(2)} DH` },
        { label: t('reservations.form.depositType', 'Deposit Type'), value: reservation.deposit_type },
        { label: t('reservations.form.depositAmount', 'Deposit Amount'), value: reservation.deposit_amount ? `${reservation.deposit_amount} DH` : '---' },
      ],
    },
    {
      title: `4 ${t('reservations.form.documentation', 'Documentation')}`,
      icon: <FileText className="w-4 h-4" />,
      fields: (() => {
        const vsUrls = reservation.vehicle_state_urls || [];
        const pcUrls = reservation.paper_contract_urls || [];
        const items: { label: string; url?: string }[] = [];
        if (vsUrls.length === 0) {
          items.push({ label: t('reservations.form.vehicleState', 'Vehicle State (Before/After)') });
        } else {
          vsUrls.forEach((url, i) => {
            items.push({ label: `${t('reservations.form.vehicleState', 'Vehicle State (Before/After)')}${vsUrls.length > 1 ? ` ${i + 1}` : ''}`, url });
          });
        }
        if (pcUrls.length === 0) {
          items.push({ label: t('reservations.form.paperContract', 'Paper Contract PDF') });
        } else {
          pcUrls.forEach((url, i) => {
            items.push({ label: `${t('reservations.form.paperContract', 'Paper Contract PDF')}${pcUrls.length > 1 ? ` ${i + 1}` : ''}`, url });
          });
        }
        return items;
      })(),
    },
    {
      title: `5 ${t('reservations.form.vehicleInspection', 'Vehicle Inspection')}`,
      icon: <Monitor className="w-4 h-4" />,
      fields: [
        { label: t('reservations.form.odometerOut', 'Starting KM'), value: reservation.odometer_out?.toString() },
        { label: t('reservations.form.odometerIn', 'Arrival KM'), value: reservation.odometer_in?.toString() },
        { label: t('reservations.form.fuelOut', 'Starting Fuel'), value: reservation.fuel_level_out != null ? `${reservation.fuel_level_out}%` : '---' },
        { label: t('reservations.form.fuelIn', 'Arrival Fuel'), value: reservation.fuel_level_in != null ? `${reservation.fuel_level_in}%` : '---' },
        { label: t('reservations.form.cleaningState', 'Pick-up clean state'), value: reservation.cleaned_before },
        { label: t('reservations.form.includedItems', 'Included Items'), value: reservation.included_items?.length ? reservation.included_items.join(', ') : '---' },
        { label: t('reservations.form.notes', 'Notes'), value: reservation.notes || '---' },
      ],
    },
  ];

  const renderCard = (section: typeof sections[0]) => (
    <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm">
      {section.title && (
        <div className="flex items-center gap-2 text-xs font-semibold text-white bg-sky-600 px-5 py-3.5">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/25 text-white text-[10px] font-black leading-none shrink-0">{section.title.split(' ')[0]}</span>
          {section.icon && <span className="shrink-0 text-white">{section.icon}</span>}
          <span>{section.title.split(' ').slice(1).join(' ')}</span>
        </div>
      )}
      <div className="flex flex-col">
        {section.fields.map((field: any, fIdx) => (
          <div key={fIdx} className={`w-full flex items-start gap-2.5 px-5 py-3 ${fIdx % 2 === 0 ? 'bg-slate-50/70' : ''}`}>
            <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
            {'url' in field ? (
              field.url ? (
                <a
                  href={field.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm font-semibold text-blue-700 inline-flex items-center gap-2 hover:underline"
                >
                  {field.label}
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-auto" />
                </a>
              ) : (
                <span className="flex-1 text-sm font-semibold text-slate-900">
                  {field.label}
                </span>
              )
            ) : (
              <div className="flex-1 flex items-baseline justify-between gap-4">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  {field.label}
                </span>
                <span className="text-sm font-bold text-slate-900 text-right">
                  {field.value}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          {[sections[0], sections[2], sections[4]].map((section, i) => (
            <div key={i}>{renderCard(section)}</div>
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-6">
          {[sections[1], sections[3]].map((section, i) => (
            <div key={i}>{renderCard(section)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
