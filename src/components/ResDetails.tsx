import React from 'react';
import {
  User, Phone, CreditCard, Car as CarIcon, Calendar,
  Clock, Gauge, Fuel, Edit, Monitor, ClipboardList, Star
} from 'lucide-react';
import BaseModal from './BaseModal';

interface ResDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  reservationData: any;
  onEdit?: () => void;
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

export default function ResDetails({ isOpen, onClose, reservationData, onEdit }: ResDetailsProps) {
  if (!reservationData) return null;

  const carInfo = reservationData.car || {};

  const computeDuration = () => {
    const start = new Date(reservationData.start_date);
    const end = new Date(reservationData.end_date);
    if (!reservationData.start_date || !reservationData.end_date || end <= start) return '---';
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
  const statusStyle = statusColors[reservationData.status as string] || 'bg-slate-100 text-slate-600 border-slate-300';

  const rate = reservationData.daily_rate || carInfo.daily_rate || 0;
  const prepay = reservationData.prepayment || 0;
  const total = reservationData.total_price != null ? reservationData.total_price : (Number(rate) * 1);
  const balance = total - prepay;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-2 border-black rounded-[12px] overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="px-4 py-2 bg-slate-50 border-b-2 border-black">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-black">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex justify-between items-center w-full pr-8">
          <div className="flex items-center gap-3">
            <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-[0.2em]">
              Reservation Details
            </h2>
            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded-[8px] ${statusStyle}`}>
              {reservationData.status || '---'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-blue-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {/* Quick Summary Strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 bg-white border-2 border-black rounded-[12px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-black/40" />
            <span className="text-[11px] font-black text-black uppercase">{computeDuration()}</span>
          </div>
          <div className="w-px h-5 bg-black/20" />
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-black/40" />
            <span className="text-[11px] font-black text-black uppercase">{formatDate(reservationData.start_date)}</span>
          </div>
          <div className="w-px h-5 bg-black/20" />
          <span className="text-[11px] font-black text-black/40">→</span>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-black/40" />
            <span className="text-[11px] font-black text-black uppercase">{formatDate(reservationData.end_date)}</span>
          </div>
        </div>

        {/* Customer */}
        <Section title="Customer">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Name" value={reservationData.customer_name || reservationData.client} icon={User} />
            <Field label="Phone" value={reservationData.customer_phone} icon={Phone} />
            <Field label="ID Card" value={reservationData.customer_id} icon={CreditCard} />
            <Field label="License" value={reservationData.license_number || reservationData.customer_license} icon={Monitor} />
          </div>
        </Section>

        {/* Vehicle & Schedule */}
        <Section title="Vehicle & Schedule">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Car" value={`${carInfo.brand || ''} ${carInfo.model || ''}`.trim() || reservationData.carName} icon={CarIcon} />
            <Field label="Plate" value={reservationData.carPlate || carInfo.plate} icon={ClipboardList} />
            <Field label="Pick-up" value={formatDate(reservationData.start_date)} icon={Calendar} />
            <Field label="Return" value={formatDate(reservationData.end_date)} icon={Calendar} />
            {reservationData.extended_return_date && (
              <Field label="Extended Return" value={formatDate(reservationData.extended_return_date)} icon={Calendar} />
            )}
          </div>
        </Section>

        {/* Billing */}
        <Section title="Billing">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Daily Rate" value={`${rate} DH`} />
            <Field label="Total Price" value={`${Number(total).toFixed(2)} DH`} />
            <Field label="Prepayment" value={`${Number(prepay).toFixed(2)} DH`} />
            <Field label="Balance Due" value={`${Number(balance).toFixed(2)} DH`} />
            <Field label="Deposit Type" value={reservationData.deposit_type} />
            <Field label="Deposit Amount" value={reservationData.deposit_amount ? `${reservationData.deposit_amount} DH` : '---'} />
            {typeof reservationData.rating === 'number' && reservationData.rating > 0 && (
              <Field label="Rating" value={`${'★'.repeat(reservationData.rating)}${'☆'.repeat(5 - reservationData.rating)}`} icon={Star} />
            )}
          </div>
        </Section>

        {/* Vehicle Inspection */}
        <Section title="Vehicle Inspection">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Starting KM" value={reservationData.odometer_out?.toString()} icon={Gauge} />
            <Field label="Arrival KM" value={reservationData.odometer_in?.toString()} icon={Gauge} />
            <Field label="Starting Fuel" value={reservationData.fuel_level_out != null ? `${reservationData.fuel_level_out}%` : '---'} icon={Fuel} />
            <Field label="Arrival Fuel" value={reservationData.fuel_level_in != null ? `${reservationData.fuel_level_in}%` : '---'} icon={Fuel} />
            <Field label="Cleaned Before Return" value={reservationData.cleaned_before} />
          </div>
        </Section>

        {/* Included Items & Notes */}
        {(reservationData.included_items?.length > 0 || reservationData.notes) && (
          <div className="border-2 border-black rounded-[12px] overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="px-4 py-2 bg-slate-50 border-b-2 border-black">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-black">Notes & Items</h3>
            </div>
            <div className="p-4 space-y-3">
              {reservationData.included_items?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {reservationData.included_items.map((item: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 border-2 border-blue-200 text-[9px] font-black text-blue-700 uppercase tracking-widest rounded-[8px]">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {reservationData.notes && (
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-black/40 mb-1">Notes</p>
                  <p className="text-[12px] font-bold text-black/80 whitespace-pre-wrap leading-relaxed">{reservationData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
