import { useTranslation } from 'react-i18next';
import { Gauge, Calendar, Shield, Settings, ClipboardList } from 'lucide-react';
import { FormattedCar, MaintenanceInterval, EssentialItem } from '../types';
import { FUEL_TYPES, CAR_STATUSES, TRANSMISSIONS } from '../constants';

interface CarFormProps {
  car?: FormattedCar | null;
  onChange: (car: Partial<FormattedCar>) => void;
}

export default function CarForm({ car, onChange }: CarFormProps) {
  const { t } = useTranslation();

  const set = (field: string, value: any) => {
    onChange({ ...(car || {}), [field]: value } as Partial<FormattedCar>);
  };

  const setNested = (field: string, index: number, value: any) => {
    const arr = (car as any)?.[field] || [];
    const newArr = [...arr];
    newArr[index] = { ...newArr[index], ...value };
    onChange({ ...(car || {}), [field]: newArr } as Partial<FormattedCar>);
  };

  const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString() : '---');

  const sections = [
    {
      title: t('carDetailsView.basicInfo', 'Basic Info'),
      icon: <Settings className="w-4 h-4" />,
      fields: [
        {
          label: t('carDetailsView.fields.brand', 'Brand'),
          input: (
            <input
              type="text"
              value={car?.brand || ''}
              onChange={(e) => set('brand', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
              placeholder={t('carForm.placeholder', 'Enter...')}
            />
          ),
        },
        {
          label: t('carDetailsView.fields.model', 'Model'),
          input: (
            <input
              type="text"
              value={car?.model || ''}
              onChange={(e) => set('model', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
              placeholder={t('carForm.placeholder', 'Enter...')}
            />
          ),
        },
        {
          label: t('carDetailsView.fields.plate', 'Plate'),
          input: (
            <input
              type="text"
              value={car?.plate || ''}
              onChange={(e) => set('plate', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors uppercase"
              placeholder={t('carForm.placeholder', 'Enter...')}
            />
          ),
        },
        {
          label: t('carDetailsView.fields.color', 'Color'),
          input: (
            <input
              type="text"
              value={car?.color || ''}
              onChange={(e) => set('color', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
              placeholder={t('carForm.placeholder', 'Enter...')}
            />
          ),
        },
        {
          label: t('carDetailsView.fields.status', 'Status'),
          input: (
            <select
              value={car?.status || ''}
              onChange={(e) => set('status', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors appearance-none cursor-pointer"
            >
              {CAR_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ),
        },
        {
          label: t('carDetailsView.fields.dailyRate', 'Daily Rate'),
          input: (
            <div className="flex items-center gap-1 w-full">
              <span className="text-sm font-semibold text-slate-500">$</span>
              <input
                type="number"
                value={car?.daily_rate || ''}
                onChange={(e) => set('daily_rate', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
                placeholder="0"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">/ day</span>
            </div>
          ),
        },
      ],
    },
    {
      title: t('carDetailsView.technicalDetails', 'Technical Details'),
      icon: <Gauge className="w-4 h-4" />,
      fields: [
        {
          label: t('carDetailsView.fields.fuelType', 'Fuel Type'),
          input: (
            <select
              value={car?.fuel_type || ''}
              onChange={(e) => set('fuel_type', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors appearance-none cursor-pointer"
            >
              <option value="">---</option>
              {FUEL_TYPES.map((ft) => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>
          ),
        },
        {
          label: t('carDetailsView.fields.transmission', 'Transmission'),
          input: (
            <select
              value={car?.transmission || ''}
              onChange={(e) => set('transmission', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors appearance-none cursor-pointer"
            >
              <option value="">---</option>
              {TRANSMISSIONS.map((tr) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
          ),
        },
        {
          label: t('carDetailsView.fields.seats', 'Seats'),
          input: (
            <input
              type="number"
              value={car?.seats || ''}
              onChange={(e) => set('seats', parseInt(e.target.value) || 0)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
              placeholder="0"
            />
          ),
        },
        {
          label: t('carDetailsView.fields.odometer', 'Odometer'),
          input: (
            <div className="flex items-center gap-1 w-full">
              <input
                type="number"
                value={car?.odometer || ''}
                onChange={(e) => set('odometer', parseInt(e.target.value) || 0)}
                className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
                placeholder="0"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">km</span>
            </div>
          ),
        },
        {
          label: t('carDetailsView.fields.gpsSim', 'GPS SIM'),
          input: (
            <input
              type="text"
              value={car?.gps_sim || ''}
              onChange={(e) => set('gps_sim', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
              placeholder={t('carForm.placeholder', 'Enter...')}
            />
          ),
        },
      ],
    },
    {
      title: t('carDetailsView.registrationInsurance', 'Registration & Insurance'),
      icon: <Shield className="w-4 h-4" />,
      fields: [
        {
          label: t('carDetailsView.fields.registrationExpiry', 'Registration Expiry'),
          input: (
            <input
              type="date"
              value={car?.registration_expiry || ''}
              onChange={(e) => set('registration_expiry', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
            />
          ),
        },
        {
          label: t('carDetailsView.fields.insuranceExpiry', 'Insurance Expiry'),
          input: (
            <input
              type="date"
              value={car?.insurance_expiry || ''}
              onChange={(e) => set('insurance_expiry', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
            />
          ),
        },
        {
          label: t('carDetailsView.fields.techInspectionExpiry', 'Tech Inspection Expiry'),
          input: (
            <input
              type="date"
              value={car?.tech_inspection_expiry || ''}
              onChange={(e) => set('tech_inspection_expiry', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
            />
          ),
        },
        {
          label: t('carDetailsView.fields.taxRenewalExpiry', 'Tax Renewal Expiry'),
          input: (
            <input
              type="date"
              value={car?.tax_renewal_expiry || ''}
              onChange={(e) => set('tax_renewal_expiry', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
            />
          ),
        },
        {
          label: t('carDetailsView.fields.vignetteExpiry', 'Vignette Expiry'),
          input: (
            <input
              type="date"
              value={car?.vignette_expiry || ''}
              onChange={(e) => set('vignette_expiry', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
            />
          ),
        },
      ],
    },
    {
      title: t('carDetailsView.dates', 'Dates'),
      icon: <Calendar className="w-4 h-4" />,
      fields: [
        {
          label: t('carDetailsView.fields.firstUseDate', 'First Use Date'),
          input: (
            <input
              type="date"
              value={car?.first_use_date || ''}
              onChange={(e) => set('first_use_date', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors"
            />
          ),
        },
        {
          label: t('carDetailsView.fields.addedOn', 'Added On'),
          input: (
            <span className="text-sm font-semibold text-slate-500">
              {formatDate(car?.created_at)}
            </span>
          ),
        },
      ],
    },
    {
      title: t('carDetailsView.essentialsMaintenance', 'Essentials & Maintenance'),
      icon: <ClipboardList className="w-4 h-4" />,
      fields: [
        {
          label: t('carDetailsView.fields.essentials', 'Essentials'),
          input: (
            <textarea
              value={
                car?.essentials?.length
                  ? car.essentials
                      .filter((e: EssentialItem) => e.checked)
                      .map((e: EssentialItem) => e.name)
                      .join(', ')
                  : ''
              }
              onChange={(e) => {
                const names = e.target.value.split(',').map((n) => n.trim()).filter(Boolean);
                const essentials = names.map((name) => ({
                  id: name,
                  name,
                  checked: true,
                }));
                set('essentials', essentials);
              }}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors resize-none"
              placeholder={t('carForm.placeholder', 'Comma separated...')}
              rows={2}
            />
          ),
        },
        {
          label: t('carDetailsView.fields.maintenanceIntervals', 'Maintenance Intervals'),
          input: (
            <textarea
              value={
                car?.intervals?.length
                  ? car.intervals
                      .map((i: MaintenanceInterval) => `${i.type}: ${i.value}`)
                      .join(' | ')
                  : ''
              }
              onChange={(e) => {
                const parts = e.target.value.split('|').map((p) => p.trim()).filter(Boolean);
                const intervals = parts.map((part) => {
                  const [type, value] = part.split(':').map((s) => s.trim());
                  return {
                    id: type || '',
                    type: type || '',
                    value: value || '',
                    lastCompleted: '',
                  };
                });
                set('intervals', intervals);
              }}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors resize-none"
              placeholder={t('carForm.placeholder', 'Type: Value | ...')}
              rows={2}
            />
          ),
        },
        {
          label: t('carDetailsView.fields.notes', 'Notes'),
          input: (
            <textarea
              value={car?.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full bg-white border-b border-slate-200 focus:border-indigo-500 text-sm font-semibold text-slate-900 outline-none py-0.5 transition-colors resize-none"
              placeholder={t('carForm.placeholder', 'Enter...')}
              rows={2}
            />
          ),
        },
      ],
    },
  ];

  return (
    <div className="p-1 sm:p-2 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
      <div className="flex flex-wrap gap-6">
        {sections.map((section, sIdx) => (
          <div
            key={sIdx}
            className="bg-blue-50/60 border border-blue-200/85 rounded-xl p-6 shadow-sm"
            style={{ flexBasis: '300px', flexShrink: 1, minWidth: '250px', maxWidth: '100%' }}
          >
            {section.title && (
              <div className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-slate-900 uppercase pb-3 mb-4 border-b border-blue-200 bg-blue-100/50 -mx-6 -mt-6 px-6 pt-5 rounded-t-xl">
                {section.icon && <span className="shrink-0 text-indigo-600">{section.icon}</span>}
                {section.title}
              </div>
            )}

            <div className="flex flex-col gap-0">
              {section.fields.map((field, fIdx) => (
                <div
                  key={fIdx}
                  className="flex flex-row flex-wrap items-baseline py-2 border-b border-slate-100 last:border-0 gap-2 w-full whitespace-normal"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap shrink-0">
                    {field.label} :
                  </span>
                  <span className="text-sm font-semibold text-slate-900 whitespace-normal w-full">
                    {field.input}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
