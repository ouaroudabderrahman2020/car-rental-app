import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Calendar, CreditCard, Gauge, ClipboardList } from 'lucide-react';
import ItemSection from './itemSection';

export interface ReservationFormData {
  clientName: string;
  clientPhone: string;
  clientId: string;
  clientLicense: string;
  pickupDate: string;
  returnDate: string;
  extendedReturnDate: string;
  dailyRate: number;
  prepayment: number;
  prepaymentType: 'fully_paid' | 'amount';
  depositType: string;
  depositAmount: number;
  odometerOut: string;
  odometerIn: string;
  fuelOut: string;
  fuelIn: string;
  cleanedBefore: string;
  includedItems: string[];
  notes: string;
}

interface ResFormProps {
  reservation?: Partial<ReservationFormData> | null;
  onChange: (data: Partial<ReservationFormData>) => void;
}

const InputField = (props: any) => {
  const { label: _, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full bg-slate-50 border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-500 ${props.className || ''}`}
    />
  );
};

const SelectField = (props: any) => {
  const { label: _, children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full bg-slate-50 border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-size-[16px] bg-position-[right_12px_center] bg-no-repeat ${props.className || ''}`}
    >
      {children}
    </select>
  );
};

const TextareaField = (props: any) => {
  const { label: _, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full bg-slate-50 border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-500 resize-none ${props.className || ''}`}
    />
  );
};

export default function ResForm({ reservation, onChange }: ResFormProps) {
  const { t } = useTranslation();

  const set = (field: string, value: any) => {
    onChange({ ...(reservation || {}), [field]: value } as Partial<ReservationFormData>);
  };

  const sections = [
    {
      title: t('reservations.form.customer', 'Customer'),
      icon: <User className="w-4 h-4" />,
      fields: [
        { label: t('reservations.form.fullName', 'Full Name'), input: <InputField type="text" value={reservation?.clientName || ''} onChange={(e: any) => set('clientName', e.target.value)} placeholder={t('reservations.form.clientPlaceholder', 'Enter client name...')} /> },
        { label: t('reservations.form.clientPhone', 'Phone'), input: <InputField type="text" value={reservation?.clientPhone || ''} onChange={(e: any) => set('clientPhone', e.target.value)} placeholder={t('reservations.form.phonePlaceholder', 'Enter phone...')} /> },
        { label: t('reservations.form.idCardNumber', 'ID Card Number'), input: <InputField type="text" value={reservation?.clientId || ''} onChange={(e: any) => set('clientId', e.target.value)} placeholder={t('reservations.form.idPlaceholder', 'ID Card...')} /> },
        { label: t('reservations.form.licenseNumber', 'License Number'), input: <InputField type="text" value={reservation?.clientLicense || ''} onChange={(e: any) => set('clientLicense', e.target.value)} placeholder={t('reservations.form.licensePlaceholder', 'License Num...')} /> },
      ],
    },
    {
      title: t('reservations.form.schedule', 'Schedule'),
      icon: <Calendar className="w-4 h-4" />,
      fields: [
        { label: t('reservations.form.pickupDate', 'Pick-up Date & Time'), input: <InputField type="datetime-local" value={reservation?.pickupDate || ''} onChange={(e: any) => set('pickupDate', e.target.value)} /> },
        { label: t('reservations.form.returnDate', 'Return Date & Time'), input: <InputField type="datetime-local" value={reservation?.returnDate || ''} onChange={(e: any) => set('returnDate', e.target.value)} /> },
        { label: t('reservations.form.extendedReturn', 'Extended Return'), input: <InputField type="datetime-local" value={reservation?.extendedReturnDate || ''} onChange={(e: any) => set('extendedReturnDate', e.target.value)} /> },
      ],
    },
    {
      title: t('reservations.form.billing', 'Billing'),
      icon: <CreditCard className="w-4 h-4" />,
      fields: [
        { label: t('reservations.form.dailyRate', 'Daily Rate'), input: <InputField type="number" value={reservation?.dailyRate ?? ''} onChange={(e: any) => set('dailyRate', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" /> },
        {
          label: t('reservations.form.prepayment', 'Prepayment'),
          input: (
            <div className="flex gap-2">
              <SelectField value={reservation?.prepaymentType || 'fully_paid'} onChange={(e: any) => set('prepaymentType', e.target.value)} className="w-1/2">
                <option value="fully_paid">{t('reservations.form.fullyPaid', 'Fully Paid')}</option>
                <option value="amount">{t('reservations.form.partial', 'Partial')}</option>
              </SelectField>
              <InputField type="number" value={reservation?.prepayment ?? ''} onChange={(e: any) => set('prepayment', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" className="w-1/2" disabled={reservation?.prepaymentType === 'fully_paid'} />
            </div>
          ),
        },
        {
          label: t('reservations.form.depositType', 'Deposit Type'),
          input: (
            <SelectField value={reservation?.depositType || ''} onChange={(e: any) => set('depositType', e.target.value)}>
              <option value="">{t('common.select', 'Select')}</option>
              <option value="None">{t('common.none', 'None')}</option>
              <option value="Cash">{t('reservations.form.cash', 'Cash')}</option>
              <option value="Cheque">{t('reservations.form.cheque', 'Cheque')}</option>
            </SelectField>
          ),
        },
        { label: t('reservations.form.depositAmount', 'Deposit Amount'), input: <InputField type="number" value={reservation?.depositAmount ?? ''} onChange={(e: any) => set('depositAmount', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" /> },
      ],
    },
    {
      title: t('reservations.form.vehicleInspection', 'Vehicle Inspection'),
      icon: <Gauge className="w-4 h-4" />,
      fields: [
        { label: t('reservations.form.startingKm', 'Starting KM'), input: <InputField type="number" value={reservation?.odometerOut || ''} onChange={(e: any) => set('odometerOut', e.target.value)} placeholder="KM" /> },
        { label: t('reservations.form.arrivalKm', 'Arrival KM'), input: <InputField type="number" value={reservation?.odometerIn || ''} onChange={(e: any) => set('odometerIn', e.target.value)} placeholder="KM" /> },
        { label: t('reservations.form.startingFuel', 'Starting Fuel'), input: <InputField type="number" value={reservation?.fuelOut || ''} onChange={(e: any) => set('fuelOut', e.target.value)} placeholder="%" /> },
        { label: t('reservations.form.arrivalFuel', 'Arrival Fuel'), input: <InputField type="number" value={reservation?.fuelIn || ''} onChange={(e: any) => set('fuelIn', e.target.value)} placeholder="%" /> },
        {
          label: t('reservations.form.cleaningState', 'Pick-up clean state'),
          input: (
            <SelectField value={reservation?.cleanedBefore || ''} onChange={(e: any) => set('cleanedBefore', e.target.value)}>
              <option value="">{t('common.select', 'Select')}</option>
              <option value="yes">{t('common.yes', 'Yes')}</option>
              <option value="no">{t('common.no', 'No')}</option>
            </SelectField>
          ),
        },
      ],
    },
    {
      title: t('reservations.form.additional', 'Additional'),
      icon: <ClipboardList className="w-4 h-4" />,
      fields: [
        {
          label: t('reservations.form.includedItems', 'Included Items'),
          input: (
            <div className="w-full">
              <ItemSection items={reservation?.includedItems || []} onChange={(names: string[]) => set('includedItems', names)} isEdit disabled={false} />
            </div>
          ),
        },
        { label: t('reservations.form.notes', 'Notes'), input: <TextareaField value={reservation?.notes || ''} onChange={(e: any) => set('notes', e.target.value)} placeholder={t('reservations.form.notesPlaceholder', 'Add any additional information...')} rows={3} /> },
      ],
    },
  ];

  return (
    <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
      <div className="flex flex-wrap gap-6">
        {sections.map((section, sIdx) => (
          <div
            key={sIdx}
            className="bg-blue-50 border border-slate-200 rounded-[12px] p-5 shadow-sm"
            style={{ flexBasis: '300px', flexShrink: 1, minWidth: '250px', maxWidth: '100%' }}
          >
            {section.title && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-3 mb-4 border-b border-slate-200 bg-slate-50 -mx-5 -mt-5 px-5 pt-4 rounded-t-[12px]">
                {section.icon && <span className="shrink-0 text-slate-500">{section.icon}</span>}
                {section.title}
              </div>
            )}
            <div className="flex flex-col gap-4">
              {section.fields.map((field, fIdx) => (
                <div key={fIdx} className="w-full flex flex-col">
                  <span className="text-xs font-semibold text-slate-600 mb-1">
                    {field.label}
                  </span>
                  {field.input}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
