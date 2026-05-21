import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, FileText, Upload, User, CreditCard, Monitor, X, ChevronDown, CheckCircle, Sparkles } from 'lucide-react';
import ItemSection from './itemSection';

export interface ReservationFormData {
  clientSearchQuery: string;
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
  carBrand: string;
  carModel: string;
  licensePlate: string;
  totalPrice: number;
  balanceDue: number;
  duration: string;
  reservationStateLabel: string;
  reservationStateColor: string;
  selectedCarId: string | null;
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
      className={`w-full bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-500 ${props.className || ''}`}
    />
  );
};

const SelectField = (props: any) => {
  const { label: _, children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-size-[16px] bg-position-[right_12px_center] bg-no-repeat ${props.className || ''}`}
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
      className={`w-full bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-500 resize-none ${props.className || ''}`}
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
        {
          label: t('reservations.form.searchClient', 'Search Client'),
          input: (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <InputField
                type="text"
                value={reservation?.clientSearchQuery || ''}
                onChange={(e: any) => set('clientSearchQuery', e.target.value)}
                placeholder={t('reservations.form.searchPlaceholder', 'Type name, ID or license to search...')}
                className="pl-10 pr-10"
              />
              {reservation?.clientSearchQuery && (
                <button
                  onClick={() => set('clientSearchQuery', '')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ),
        },
        {
          label: t('reservations.form.fullName', 'Full Name'),
          input: (
            <div className="flex">
              <InputField
                type="text"
                value={reservation?.clientName || ''}
                onChange={(e: any) => set('clientName', e.target.value)}
                placeholder={t('reservations.form.clientPlaceholder', 'Enter client name...')}
                className="flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => set('clientName', reservation?.clientSearchQuery || '')}
                className="px-3 bg-slate-50 border border-slate-200 border-l-0 rounded-r-[12px] text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0"
                title="Copy from search"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
              </button>
            </div>
          ),
        },
        {
          label: t('reservations.form.idCardNumber', 'ID Card Number'),
          input: (
            <div className="flex">
              <InputField
                type="text"
                value={reservation?.clientId || ''}
                onChange={(e: any) => set('clientId', e.target.value)}
                placeholder={t('reservations.form.idPlaceholder', 'ID Card...')}
                className="flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => set('clientId', reservation?.clientSearchQuery || '')}
                className="px-3 bg-slate-50 border border-slate-200 border-l-0 rounded-r-[12px] text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
              </button>
            </div>
          ),
        },
        {
          label: t('reservations.form.licenseNumber', 'License Number'),
          input: (
            <div className="flex">
              <InputField
                type="text"
                value={reservation?.clientLicense || ''}
                onChange={(e: any) => set('clientLicense', e.target.value)}
                placeholder={t('reservations.form.licensePlaceholder', 'License Num...')}
                className="flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => set('clientLicense', reservation?.clientSearchQuery || '')}
                className="px-3 bg-slate-50 border border-slate-200 border-l-0 rounded-r-[12px] text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
              </button>
            </div>
          ),
        },
      ],
    },
    {
      title: t('reservations.form.schedule', 'Schedule'),
      icon: <Search className="w-4 h-4" />,
      fields: [
        {
          label: t('reservations.form.carSelection', 'Car Selection'),
          input: (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm">
              <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-3-3c-.4-.4-.9-.6-1.4-.6h-3.2c-.5 0-1 .2-1.4.6L6 10l-3.5.1C1.7 10.3 1 11.1 1 12v3c0 .6.4 1 1 1h2"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></svg>
              <span className="flex-1 text-slate-900 font-medium truncate">
                {reservation?.selectedCarId && reservation?.licensePlate
                  ? `${reservation.licensePlate} - ${reservation.carBrand || ''} ${reservation.carModel || ''}`
                  : t('reservations.form.selectCar', 'Select Car')}
              </span>
              <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ),
        },
        { label: t('reservations.form.pickupDate', 'Pick-up Date & Time'), input: <InputField type="datetime-local" value={reservation?.pickupDate || ''} onChange={(e: any) => set('pickupDate', e.target.value)} /> },
        { label: t('reservations.form.returnDate', 'Return Date & Time'), input: <InputField type="datetime-local" value={reservation?.returnDate || ''} onChange={(e: any) => set('returnDate', e.target.value)} /> },
        { label: t('reservations.form.extendedReturn', 'Extended Return'), input: <InputField type="datetime-local" value={reservation?.extendedReturnDate || ''} onChange={(e: any) => set('extendedReturnDate', e.target.value)} /> },
        {
          label: t('reservations.form.state', 'RESERVATION STATE'),
          input: (
            <div className={`h-9 flex items-center justify-center rounded-[12px] ${reservation?.reservationStateColor || 'bg-slate-200 text-slate-700'}`}>
              <span className="text-[11px] font-black uppercase tracking-widest">
                {reservation?.reservationStateLabel || 'measuring...'}
              </span>
            </div>
          ),
        },
        {
          label: t('reservations.form.duration', 'Duration'),
          input: (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 font-medium">
              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {reservation?.duration || '0 Days, 0 Hours'}
            </div>
          ),
        },
      ],
    },
    {
      title: t('reservations.form.billing', 'Billing'),
      icon: <CreditCard className="w-4 h-4" />,
      fields: [
        { label: t('reservations.form.dailyRate', 'Daily Rate'), input: <InputField type="number" value={reservation?.dailyRate ?? ''} onChange={(e: any) => set('dailyRate', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" /> },
        {
          label: t('reservations.form.totalPriceCalc', 'Total Price'),
          input: (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 font-semibold">
              <CreditCard className="w-4 h-4 text-slate-400" />
              {`${(reservation?.totalPrice || 0).toFixed(2)} DH`}
            </div>
          ),
        },
        {
          label: t('reservations.form.prepayment', 'Prepayment'),
          input: (
            <div className="flex flex-col gap-2">
              <div className="flex border border-slate-200 rounded-[12px] overflow-hidden bg-white">
                <select
                  value={reservation?.prepaymentType || 'fully_paid'}
                  onChange={(e: any) => {
                    set('prepaymentType', e.target.value);
                    if (e.target.value === 'fully_paid') set('prepayment', 0);
                  }}
                  className="bg-slate-50 border-r border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="fully_paid">{t('reservations.form.fullyPaid', 'Fully Paid')}</option>
                  <option value="amount">{t('reservations.form.partial', 'Partial')}</option>
                </select>
                <input
                  type="number"
                  value={reservation?.prepayment ?? ''}
                  onChange={(e: any) => set('prepayment', e.target.value === '' ? '' : parseFloat(e.target.value))}
                  disabled={reservation?.prepaymentType === 'fully_paid'}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 text-sm font-medium focus:outline-none disabled:bg-slate-50"
                />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-semibold">{t('reservations.form.balanceDue', 'Balance Due')}:</span>
                <span className={`font-bold ${(reservation?.balanceDue || 0) > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {(reservation?.balanceDue || 0) <= 0 ? 'none' : `${(reservation?.balanceDue || 0).toFixed(2)} DH`}
                </span>
              </div>
            </div>
          ),
        },
        {
          label: t('reservations.form.depositType', 'Deposit Type'),
          input: (
            <SelectField value={reservation?.depositType || ''} onChange={(e: any) => {
              set('depositType', e.target.value);
              if (e.target.value === '' || e.target.value === 'None') set('depositAmount', 0);
            }}>
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
      title: t('reservations.form.documentation', 'Documentation'),
      icon: <FileText className="w-4 h-4" />,
      fields: [
        {
          label: t('reservations.form.vehicleState', 'Vehicle State (Before/After)'),
          input: (
            <div className="flex flex-col gap-2">
              <button type="button" className="h-9 px-4 bg-white border border-slate-200 rounded-[12px] flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all">
                <Upload className="w-3.5 h-3.5" />
                {t('common.upload', 'Upload Files')}
              </button>
            </div>
          ),
        },
        {
          label: t('reservations.form.paperContract', 'Paper Contract PDF'),
          input: (
            <div className="flex flex-col gap-2">
              <button type="button" className="h-9 px-4 bg-white border border-slate-200 rounded-[12px] flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all">
                <Upload className="w-3.5 h-3.5" />
                {t('common.upload', 'Upload Files')}
              </button>
            </div>
          ),
        },
      ],
    },
    {
      title: t('reservations.form.vehicleInspection', 'Vehicle Inspection'),
      icon: <Monitor className="w-4 h-4" />,
      fields: [
        { label: 'Starting KM', input: <InputField type="number" value={reservation?.odometerOut || ''} onChange={(e: any) => set('odometerOut', e.target.value)} placeholder="KM" /> },
        { label: 'Arrival KM', input: <InputField type="number" value={reservation?.odometerIn || ''} onChange={(e: any) => set('odometerIn', e.target.value)} placeholder="KM" /> },
        { label: 'Starting Fuel', input: <InputField type="number" value={reservation?.fuelOut || ''} onChange={(e: any) => set('fuelOut', e.target.value)} placeholder="%" /> },
        { label: 'Arrival Fuel', input: <InputField type="number" value={reservation?.fuelIn || ''} onChange={(e: any) => set('fuelIn', e.target.value)} placeholder="%" /> },
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
