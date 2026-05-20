import React from 'react';
import {
  User, Phone, CreditCard, Car as CarIcon, Calendar,
  Clock, Gauge, Fuel, Monitor, ClipboardList, Star
} from 'lucide-react';
import { FormattedReservation, Car } from '../types';

interface ReservationDetailsViewProps {
  reservation: FormattedReservation;
}

const Field = ({ label, value, icon: Icon, className = '' }: { label: string; value?: string | number | null; icon?: any; className?: string }) => (
  <div className={`flex items-start gap-2.5 ${className}`}>
    {Icon && <Icon className="w-3.5 h-3.5 text-black/30 mt-0.5 shrink-0" />}
    <div className="min-w-0 flex-1">
      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-black/40">{label}</p>
      <p className="text-[12px] font-bold text-black truncate">{value || '---'}</p>
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-2 border-black rounded-[12px] overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
    <div className="px-4 py-2 bg-slate-50 border-b-2 border-black">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-black">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default function ReservationDetailsView({ reservation }: ReservationDetailsViewProps) {
  const carInfo = (reservation.car || {}) as Partial<Car>;

  const computeDuration = () => {
    const start = new Date(reservation.start_date);
    const end = new Date(reservation.end_date);
    if (!reservation.start_date || !reservation.end_date || end <= start) return '---';
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${Math.floor(totalHours / 24)}d ${Math.floor(totalHours % 24)}h`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const statusColors: Record<string, string> = {
    Confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
    Active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Completed: 'bg-slate-100 text-slate-600 border-slate-300',
    Overdue: 'bg-red-100 text-red-800 border-red-300',
    Reserved: 'bg-amber-100 text-amber-800 border-amber-300',
  };
  const statusStyle = statusColors[reservation.status as string] || 'bg-slate-100 text-slate-600 border-slate-300';

  const r = reservation as any;
  const rate = r.daily_rate || carInfo.daily_rate || 0;
  const prepay = reservation.prepayment || 0;
  const total = reservation.total_price != null ? reservation.total_price : (Number(rate) * 1);
  const balance = total - prepay;

  return (
    <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded-[8px] ${statusStyle}`}>
          {reservation.status || '---'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 bg-white border-2 border-black rounded-[12px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-black/40" />
          <span className="text-[11px] font-black text-black uppercase">{computeDuration()}</span>
        </div>
        <div className="w-px h-5 bg-black/20" />
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-black/40" />
          <span className="text-[11px] font-black text-black uppercase">{formatDate(reservation.start_date)}</span>
        </div>
        <div className="w-px h-5 bg-black/20" />
        <span className="text-[11px] font-black text-black/40">→</span>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-black/40" />
          <span className="text-[11px] font-black text-black uppercase">{formatDate(reservation.end_date)}</span>
        </div>
      </div>

      <Section title="Customer">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Name" value={reservation.customer_name || reservation.client} icon={User} />
          <Field label="Phone" value={reservation.customer_phone} icon={Phone} />
          <Field label="ID Card" value={r.customer_id} icon={CreditCard} />
          <Field label="License" value={r.license_number || r.customer_license} icon={Monitor} />
        </div>
      </Section>

      <Section title="Vehicle & Schedule">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Car" value={`${carInfo.brand || ''} ${carInfo.model || ''}`.trim() || reservation.carName} icon={CarIcon} />
          <Field label="Plate" value={reservation.carPlate || carInfo.plate} icon={ClipboardList} />
          <Field label="Pick-up" value={formatDate(reservation.start_date)} icon={Calendar} />
          <Field label="Return" value={formatDate(reservation.end_date)} icon={Calendar} />
          {reservation.extended_return_date && (
            <Field label="Extended Return" value={formatDate(reservation.extended_return_date)} icon={Calendar} />
          )}
        </div>
      </Section>

      <Section title="Billing">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Daily Rate" value={`${rate} DH`} />
          <Field label="Total Price" value={`${Number(total).toFixed(2)} DH`} />
          <Field label="Prepayment" value={`${Number(prepay).toFixed(2)} DH`} />
          <Field label="Balance Due" value={`${Number(balance).toFixed(2)} DH`} />
          <Field label="Deposit Type" value={reservation.deposit_type} />
          <Field label="Deposit Amount" value={reservation.deposit_amount ? `${reservation.deposit_amount} DH` : '---'} />
          {typeof reservation.rating === 'number' && reservation.rating > 0 && (
            <Field label="Rating" value={`${'★'.repeat(reservation.rating)}${'☆'.repeat(5 - reservation.rating)}`} icon={Star} />
          )}
        </div>
      </Section>

      <Section title="Vehicle Inspection">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Starting KM" value={reservation.odometer_out?.toString()} icon={Gauge} />
          <Field label="Arrival KM" value={reservation.odometer_in?.toString()} icon={Gauge} />
          <Field label="Starting Fuel" value={reservation.fuel_level_out != null ? `${reservation.fuel_level_out}%` : '---'} icon={Fuel} />
          <Field label="Arrival Fuel" value={reservation.fuel_level_in != null ? `${reservation.fuel_level_in}%` : '---'} icon={Fuel} />
          <Field label="Cleaned Before Return" value={reservation.cleaned_before} />
        </div>
      </Section>

      {(reservation.included_items?.length > 0 || reservation.notes) && (
        <div className="border-2 border-black rounded-[12px] overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="px-4 py-2 bg-slate-50 border-b-2 border-black">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black">Notes & Items</h3>
          </div>
          <div className="p-4 space-y-3">
            {reservation.included_items?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {reservation.included_items.map((item: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 border-2 border-blue-200 text-[9px] font-black text-blue-700 uppercase tracking-widest rounded-[8px]">
                    {item}
                  </span>
                ))}
              </div>
            )}
            {reservation.notes && (
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.15em] text-black/40 mb-1">Notes</p>
                <p className="text-[12px] font-bold text-black/80 whitespace-pre-wrap leading-relaxed">{reservation.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
