import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, FileText, Calendar, Gauge, Upload, Monitor, Trash2 } from 'lucide-react';
import { FormattedCar, MaintenanceInterval, EssentialItem } from '../types';
import { FUEL_TYPES, TRANSMISSIONS } from '../constants';
import ItemSection from './itemSection';

const colors = [
  { name: 'white', hex: '#FFFFFF', border: 'border-slate-200' },
  { name: 'black', hex: '#000000', border: 'border-black' },
  { name: 'green', hex: '#10B981', border: 'border-green-600' },
  { name: 'yellow', hex: '#FACC15', border: 'border-yellow-600' },
  { name: 'silver', hex: '#94A3B8', border: 'border-slate-400' },
  { name: 'blue', hex: '#3B82F6', border: 'border-blue-600' },
  { name: 'red', hex: '#EF4444', border: 'border-red-600' },
  { name: 'orange', hex: '#F97316', border: 'border-orange-600' },
];

const serviceOptions = [
  { key: 'engineOil', value: "Engine Oil" },
  { key: 'coolant', value: "Coolant (Antigel)" },
  { key: 'brakeFluid', value: "Brake Fluid" },
  { key: 'gearboxOil', value: "Gearbox Oil" },
  { key: 'airFilter', value: "Air Filter" },
  { key: 'fuelFilter', value: "Fuel Filter" },
  { key: 'acFilter', value: "Cabin/AC Filter" },
  { key: 'brakePads', value: "Brake Pads (Plaquettes de frein)" },
  { key: 'tires', value: "Tires" },
  { key: 'wipers', value: "Wiper Blades" },
  { key: 'timingBelt', value: "Timing Belt (Courroie)" },
  { key: 'battery', value: "Battery" },
  { key: 'sparkPlugs', value: "Spark Plugs (Bougies)" },
  { key: 'shocks', value: "Shock Absorbers" }
];

interface CarFormProps {
  car?: Partial<FormattedCar> | null;
  onChange: (car: Partial<FormattedCar>) => void;
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

const ImageField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col">
      <input
        type="file"
        ref={inputRef}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onChange(reader.result as string);
          reader.readAsDataURL(file);
        }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        className="w-full aspect-video border border-slate-200 rounded-[12px] bg-white flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden"
      >
        {value ? (
          value.startsWith('data:') ? (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <span className="text-[10px] font-bold text-slate-400">{t('carForm.fileLinked', 'File linked')}</span>
            </div>
          )
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-300" />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('clientForm.uploadFile', 'Upload')}</p>
          </>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(''); }}
          className="mt-1 text-[9px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1 hover:underline"
        >
          <Trash2 className="w-3 h-3" /> {t('common.remove', 'Remove')}
        </button>
      )}
    </div>
  );
};

const FileField = ({ label, value, onChange, isPdf }: { label: string; value: string; onChange: (v: string) => void; isPdf?: boolean }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <input
        type="file"
        ref={inputRef}
        accept={isPdf ? "application/pdf" : "image/*,application/pdf"}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onChange(reader.result as string);
          reader.readAsDataURL(file);
        }}
      />
      <div className="flex flex-col gap-2 w-full">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-10 px-4 bg-white border border-slate-200 rounded-[12px] flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all w-full"
        >
          <Upload className="w-3.5 h-3.5" />
          {t('clientForm.uploadFile', 'Upload')}
        </button>
        {value && (
          <div className="flex items-center justify-between px-3 h-10 bg-blue-50 border border-blue-200 rounded-[12px]">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-[10px] font-bold text-blue-900 truncate">
                {isPdf ? t('carForm.pdfLabel', 'Documentation') : label.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {value.startsWith('data:') ? (
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = value;
                    link.download = `${label}.${isPdf ? 'pdf' : 'png'}`;
                    link.click();
                  }}
                  className="p-1.5 hover:bg-blue-200 rounded-full text-blue-600 transition-colors"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.open(value, '_blank')}
                  className="p-1.5 hover:bg-blue-200 rounded-full text-blue-600 transition-colors"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1.5 hover:bg-red-100 rounded-full text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CarForm({ car, onChange }: CarFormProps) {
  const { t } = useTranslation();
  const [selectedService, setSelectedService] = React.useState(serviceOptions[0].value);

  const set = (field: string, value: any) => {
    onChange({ ...(car || {}), [field]: value } as Partial<FormattedCar>);
  };

  const intervals: MaintenanceInterval[] = car?.intervals || [];
  const currentInterval = intervals.find((i) => i.type === selectedService);

  const updateInterval = (field: 'value' | 'lastCompleted', val: string) => {
    const existing = intervals.findIndex((i) => i.type === selectedService);
    let newIntervals: MaintenanceInterval[];
    if (existing >= 0) {
      newIntervals = [...intervals];
      newIntervals[existing] = { ...newIntervals[existing], [field]: val };
    } else {
      newIntervals = [...intervals, { id: selectedService, type: selectedService, value: '', lastCompleted: '' }];
      newIntervals[newIntervals.length - 1] = { ...newIntervals[newIntervals.length - 1], [field]: val };
    }
    set('intervals', newIntervals);
  };

  const sections = [
    {
      title: t('carDetailsView.basicInfo', 'Basic Info'),
      icon: <Settings className="w-4 h-4" />,
      fields: [
        { label: t('carDetailsView.fields.brand', 'Brand'), input: <InputField type="text" value={car?.brand || ''} onChange={(e: any) => set('brand', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('carDetailsView.fields.model', 'Model'), input: <InputField type="text" value={car?.model || ''} onChange={(e: any) => set('model', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('carDetailsView.fields.plate', 'Plate'), input: <InputField type="text" value={car?.plate || ''} onChange={(e: any) => set('plate', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} className="uppercase" /> },
        {
          label: t('carDetailsView.fields.color', 'Color'),
          input: (
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button key={c.name} type="button" onClick={() => set('color', c.name)} className={`w-8 h-8 rounded-full border transition-all ${c.border} ${(car?.color || '').toLowerCase() === c.name ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'}`} style={{ backgroundColor: c.hex }} title={t(`carForm.color${c.name.charAt(0).toUpperCase() + c.name.slice(1)}`, c.name)} />
              ))}
            </div>
          ),
        },
        {
          label: t('carDetailsView.fields.dailyRate', 'Daily Rate'),
          input: (
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-slate-500">$</span>
              <div className="flex-1"><InputField type="number" value={car?.daily_rate || ''} onChange={(e: any) => set('daily_rate', parseFloat(e.target.value) || 0)} placeholder="0" /></div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{t('common.perDay')}</span>
            </div>
          ),
        },
        {
          label: t('carDetailsView.fields.odometer', 'Odometer'),
          input: (
            <div className="flex items-center gap-1">
              <div className="flex-1"><InputField type="number" value={car?.odometer || ''} onChange={(e: any) => set('odometer', parseInt(e.target.value) || 0)} placeholder="0" /></div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{t('carForm.odometerUnit', 'km')}</span>
            </div>
          ),
        },
        { label: t('carDetailsView.fields.status', 'Status'), input: <SelectField value={car?.status || ''} onChange={(e: any) => set('status', e.target.value)}>{['available', 'unavailable', 'in maintenance'].map((s) => (<option key={s} value={s}>{t(`common.${s === 'in maintenance' ? 'maintenance' : s}`, s)}</option>))}</SelectField> },
      ],
    },
    {
      title: t('carForm.documents', 'Documents'),
      icon: <FileText className="w-4 h-4" />,
      fields: [
        { label: t('carForm.uploadImage', 'Vehicle Image'), input: <ImageField label="Vehicle Image" value={car?.image_url || ''} onChange={(v) => set('image_url', v)} /> },
        { label: t('carForm.registrationCard', 'Registration Card'), input: <FileField label="Registration Card" value={car?.registration_card_url || ''} onChange={(v) => set('registration_card_url', v)} /> },
        { label: t('carForm.insurance', 'Insurance'), input: <FileField label="Insurance" value={car?.insurance_url || ''} onChange={(v) => set('insurance_url', v)} /> },
        { label: t('carForm.vignette', 'Vignette'), input: <FileField label="Vignette" value={car?.vignette_url || ''} onChange={(v) => set('vignette_url', v)} /> },
        { label: t('carForm.pdfLabel', 'All-in-one Documentation'), input: <FileField label="Documentation" value={car?.documentation_url || ''} onChange={(v) => set('documentation_url', v)} isPdf /> },
      ],
    },
    {
      title: t('carForm.otherDetails', 'Other Details'),
      icon: <Calendar className="w-4 h-4" />,
      fields: [
        { label: t('carForm.firstUse', 'First Use'), input: <InputField type="date" value={car?.first_use_date || ''} onChange={(e: any) => set('first_use_date', e.target.value)} /> },
        { label: t('carForm.registrationExpir', 'Registration Expir'), input: <InputField type="date" value={car?.registration_expiry || ''} onChange={(e: any) => set('registration_expiry', e.target.value)} /> },
        { label: t('carForm.insuranceExpir', 'Insurance Expir'), input: <InputField type="date" value={car?.insurance_expiry || ''} onChange={(e: any) => set('insurance_expiry', e.target.value)} /> },
        { label: t('carForm.vignetteExpir', 'Vignette Expir'), input: <InputField type="date" value={car?.vignette_expiry || ''} onChange={(e: any) => set('vignette_expiry', e.target.value)} /> },
        {
          label: t('carForm.transmission', 'Transmission'),
          input: (
            <div className="flex bg-white border border-slate-200 rounded-[12px] overflow-hidden">
              {TRANSMISSIONS.map((trans, index) => (
                <button key={trans} type="button" onClick={() => set('transmission', trans)} className={`flex-1 font-bold text-xs uppercase tracking-wider py-2 transition-all ${index !== 0 ? 'border-l border-slate-200' : ''} ${(car?.transmission || '') === trans ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{t(`carForm.trans${trans}`, trans)}</button>
              ))}
            </div>
          ),
        },
        { label: t('carForm.fuelType', 'Fuel Type'), input: <SelectField value={car?.fuel_type || ''} onChange={(e: any) => set('fuel_type', e.target.value)}><option value="">---</option>{FUEL_TYPES.map((ft) => (<option key={ft} value={ft}>{t(`carForm.fuel${ft}`, ft)}</option>))}</SelectField> },
        { label: t('carForm.gpsSim', 'GPS Sim'), input: <InputField type="text" value={car?.gps_sim || ''} onChange={(e: any) => set('gps_sim', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('carForm.seats', 'Seats'), input: <InputField type="number" value={car?.seats || ''} onChange={(e: any) => set('seats', parseInt(e.target.value) || 0)} placeholder="0" /> },
        {
          label: t('carForm.essentials', 'Essentials'),
          input: (
            <div className="w-full">
              <ItemSection items={car?.essentials?.filter((e: EssentialItem) => e.checked).map((e: EssentialItem) => e.name) || []} onChange={(names: string[]) => { set('essentials', names.map((name) => ({ id: name, name, checked: true }))); }} isEdit disabled={false} />
            </div>
          ),
        },
        { label: t('carForm.notes', 'Notes'), input: <TextareaField value={car?.notes || ''} onChange={(e: any) => set('notes', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} rows={3} /> },
      ],
    },
    {
      title: t('carForm.maintenance', 'Maintenance'),
      icon: <Gauge className="w-4 h-4" />,
      fields: [
        { label: t('carForm.maintenanceType', 'Select Maintenance Category'), input: <SelectField value={selectedService} onChange={(e: any) => setSelectedService(e.target.value)}>{serviceOptions.map((opt) => (<option key={opt.key} value={opt.value}>{t(`carForm.serviceOptions.${opt.key}`, opt.value)}</option>))}</SelectField> },
        { label: t('carForm.intervalValue', 'Interval Value'), input: <InputField type="number" value={currentInterval?.value || ''} onChange={(e: any) => updateInterval('value', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('carForm.lastCompleted', 'Last Completed'), input: <InputField type="date" value={currentInterval?.lastCompleted || ''} onChange={(e: any) => updateInterval('lastCompleted', e.target.value)} /> },
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
