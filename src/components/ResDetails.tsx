import { User, Phone, Calendar, Car as CarIcon, Gauge, Fuel, DollarSign, Star, ClipboardList } from 'lucide-react';
import { FormattedReservation, Car } from '../types';

interface ReservationDetailsViewProps {
  reservation: FormattedReservation;
}

export default function ReservationDetailsView({ reservation }: ReservationDetailsViewProps) {
  const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString() : '---');
  const carInfo = (reservation.car || {}) as Partial<Car>;
  const r = reservation as any;
  const rate = r.daily_rate || carInfo.daily_rate || 0;
  const prepay = reservation.prepayment || 0;
  const total = reservation.total_price != null ? reservation.total_price : (Number(rate) * 1);
  const balance = total - prepay;

  const sections = [
    {
      title: 'Customer',
      icon: <User className="w-4 h-4" />,
      fields: [
        { label: 'Name', value: reservation.customer_name || reservation.client },
        { label: 'Phone', value: reservation.customer_phone },
        { label: 'ID Card', value: r.customer_id },
        { label: 'License', value: r.license_number || r.customer_license },
      ],
    },
    {
      title: 'Vehicle & Schedule',
      icon: <CarIcon className="w-4 h-4" />,
      fields: [
        { label: 'Car', value: `${carInfo.brand || ''} ${carInfo.model || ''}`.trim() || reservation.carName },
        { label: 'Plate', value: reservation.carPlate || carInfo.plate },
        { label: 'Pick-up', value: formatDate(reservation.start_date) },
        { label: 'Return', value: formatDate(reservation.end_date) },
        { label: 'Extended Return', value: formatDate(reservation.extended_return_date) },
        { label: 'Duration', value: (() => {
          const start = new Date(reservation.start_date);
          const end = new Date(reservation.end_date);
          if (!reservation.start_date || !reservation.end_date || end <= start) return '---';
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return `${Math.floor(hours / 24)}d ${Math.floor(hours % 24)}h`;
        })() },
      ],
    },
    {
      title: 'Billing',
      icon: <DollarSign className="w-4 h-4" />,
      fields: [
        { label: 'Daily Rate', value: `${rate} DH` },
        { label: 'Total Price', value: `${Number(total).toFixed(2)} DH` },
        { label: 'Prepayment', value: `${Number(prepay).toFixed(2)} DH` },
        { label: 'Balance Due', value: `${Number(balance).toFixed(2)} DH` },
        { label: 'Deposit Type', value: reservation.deposit_type },
        { label: 'Deposit Amount', value: reservation.deposit_amount ? `${reservation.deposit_amount} DH` : '---' },
        { label: 'Rating', value: typeof reservation.rating === 'number' && reservation.rating > 0 ? `${'★'.repeat(reservation.rating)}${'☆'.repeat(5 - reservation.rating)}` : '---' },
      ],
    },
    {
      title: 'Vehicle Inspection',
      icon: <Gauge className="w-4 h-4" />,
      fields: [
        { label: 'Starting KM', value: reservation.odometer_out?.toString() },
        { label: 'Arrival KM', value: reservation.odometer_in?.toString() },
        { label: 'Starting Fuel', value: reservation.fuel_level_out != null ? `${reservation.fuel_level_out}%` : '---' },
        { label: 'Arrival Fuel', value: reservation.fuel_level_in != null ? `${reservation.fuel_level_in}%` : '---' },
        { label: 'Cleaned Before Return', value: reservation.cleaned_before },
      ],
    },
    {
      title: 'Notes & Items',
      icon: <ClipboardList className="w-4 h-4" />,
      fields: [
        { label: 'Included Items', value: reservation.included_items?.length ? reservation.included_items.join(', ') : '---' },
        { label: 'Notes', value: reservation.notes || '---' },
      ],
    },
  ];

  const renderCard = (section: typeof sections[0]) => (
    <div className="bg-slate-50/80 border border-slate-200/85 rounded-xl p-5 sm:p-6 shadow-sm">
      {section.title && (
        <div className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-slate-900 uppercase pb-3 mb-4 border-b border-slate-200">
          {section.icon && <span className="shrink-0 text-indigo-600">{section.icon}</span>}
          {section.title}
        </div>
      )}
      <div className="flex flex-col gap-0">
        {section.fields.map((field, fIdx) => (
          <div
            key={fIdx}
            className="flex items-baseline py-2 border-b border-slate-100 last:border-0 gap-2 w-full min-w-0"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap shrink-0">
              {field.label} :
            </span>
            <span className="text-sm font-semibold text-slate-900 break-words flex-grow min-w-0">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const leftCol: typeof sections = [];
  const rightCol: typeof sections = [];
  sections.forEach((s, i) => {
    if (i % 2 === 0) leftCol.push(s);
    else rightCol.push(s);
  });

  return (
    <div className="p-1 sm:p-2 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
      <div className="px-4 py-2 mb-2 flex items-center gap-3">
        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border rounded-[8px] bg-blue-100 text-blue-800 border-blue-300">
          {reservation.status || '---'}
        </span>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {leftCol.map((section, i) => (
            <div key={i}>{renderCard(section)}</div>
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {rightCol.map((section, i) => (
            <div key={i}>{renderCard(section)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
