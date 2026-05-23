import React from 'react';
import { User, Phone, Calendar, Car as CarIcon, Gauge, Fuel, DollarSign, Star, ClipboardList, CreditCard, Monitor } from 'lucide-react';
import { FormattedReservation, Car } from '../types';

interface ReservationDetailsViewProps {
  reservation: FormattedReservation;
}

export default function ReservationDetailsView({ reservation }: ReservationDetailsViewProps) {
  const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString() : '---');
  const carInfo = (reservation.car || {}) as Partial<Car>;
  const rate = carInfo.daily_rate || 0;
  const prepay = reservation.prepayment || 0;
  const total = reservation.total_price != null ? reservation.total_price : (Number(rate) * 1);
  const balance = reservation.balance_due != null ? reservation.balance_due : (total - prepay);

  const sections = [
    {
      title: '1 Customer',
      icon: <User className="w-4 h-4" />,
      fields: [
        { label: 'Name', value: reservation.customer_name || reservation.client },
        { label: 'ID Card', value: reservation.customer_national_id },
        { label: 'License', value: reservation.customer_license },
      ],
    },
    {
      title: '2 Vehicle & Schedule',
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
      title: '3 Billing',
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
      title: '4 Vehicle Inspection',
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
      title: '5 Notes & Items',
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
        <div className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-white uppercase pb-3 mb-4 border-b border-slate-200 bg-sky-600 -mx-5 -mt-5 px-5 pt-4 rounded-t-xl">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/25 text-white text-[10px] font-black leading-none shrink-0">{section.title.split(' ')[0]}</span>
          {section.icon && <span className="shrink-0 text-white">{section.icon}</span>}
          <span>{section.title.split(' ').slice(1).join(' ')}</span>
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

  return (
    <div className="p-1 sm:p-2 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
      <div className="px-4 py-2 mb-2 flex items-center gap-3">
        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border rounded-[8px] bg-blue-100 text-blue-800 border-blue-300">
          {reservation.status || '---'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {sections.map((section, i) => (
          <div key={i} className="w-full">
            {renderCard(section)}
          </div>
        ))}
      </div>
    </div>
  );
}
