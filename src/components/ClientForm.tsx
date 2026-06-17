import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, FileText, Calendar, Star, Upload, Trash2, RotateCcw } from 'lucide-react';
import { Client } from '../types';
import { useNotification } from '../contexts/NotificationContext';

interface ClientFormProps {
  client?: Partial<Client> | null;
  onChange: (client: Partial<Client>) => void;
}

export interface ClientFormHandle {
  validate: () => boolean;
}

const InputField = (props: any) => {
  const { label: _, hasError, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full bg-white border rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all disabled:bg-slate-100 disabled:text-slate-500 ${hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'} ${props.className || ''}`}
    />
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

const DocField = ({ docType, label, value, onChange }: {
  docType: string;
  label: string;
  value?: { file_data?: string; file_name?: string; mime_type?: string; file_url?: string };
  onChange: (doc: { doc_type: string; file_data?: string; file_name?: string; mime_type?: string } | null) => void;
}) => {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <input
        type="file"
        ref={inputRef}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onChange({
            doc_type: docType,
            file_data: reader.result as string,
            file_name: file.name,
            mime_type: file.type,
          });
          reader.readAsDataURL(file);
        }}
      />
      <div className="flex flex-col gap-2 w-full">
        {value ? (
          <div className="flex items-center justify-between px-3 h-10 bg-blue-50 border border-blue-200 rounded-[12px]">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              {value.file_url ? (
                <a href={value.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-900 truncate hover:underline">
                  {value.file_name || label}
                </a>
              ) : (
                <span className="text-[10px] font-bold text-blue-900 truncate">
                  {value.file_name || label}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1.5 hover:bg-red-100 rounded-full text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-10 px-4 bg-white border border-slate-200 rounded-[12px] flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all w-full"
          >
            <Upload className="w-3.5 h-3.5" />
            {t('clientForm.uploadFile', 'Upload')}
          </button>
        )}
      </div>
    </div>
  );
};

const ClientForm = forwardRef<ClientFormHandle, ClientFormProps>(({ client, onChange }, ref) => {
  const { t } = useTranslation();
  const { showToast } = useNotification();
  const [errors, setErrors] = React.useState<Record<string, boolean>>({});

  React.useImperativeHandle(ref, () => ({
    validate: () => {
      const newErrors: Record<string, boolean> = {};
      if (!client?.name) newErrors.name = true;
      if (!client?.national_id) newErrors.national_id = true;
      if (!client?.license_number) newErrors.license_number = true;
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        showToast(t('clientForm.fillRequiredFields', 'Please fill all required fields'), 'error');
        return false;
      }
      return true;
    }
  }));

  const set = (field: string, value: any) => {
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    onChange({ [field]: value } as Partial<Client>);
  };

  const getDoc = (type: string) => (client?.documents || []).find(d => d.doc_type === type);

  const setDoc = (type: string, data: { file_data?: string; file_name?: string; mime_type?: string } | null) => {
    const docs: any[] = [...(client?.documents || [])];
    if (data === null) {
      set('documents', docs.filter((d: any) => d.doc_type !== type));
    } else {
      const idx = docs.findIndex((d: any) => d.doc_type === type);
      const entry = { ...data, doc_type: type };
      if (idx >= 0) docs[idx] = entry;
      else docs.push(entry);
      set('documents', docs);
    }
  };

  const sections = [
    {
      title: `1 ${t('clientForm.identity', 'Identity')}`,
      icon: <User className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.fullName', 'Full Name') + ' *', input: <InputField hasError={errors.name} type="text" value={client?.name || ''} onChange={(e: any) => set('name', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('clientForm.nationalId', 'National ID') + ' *', input: <InputField hasError={errors.national_id} type="text" value={client?.national_id || client?.id_card_number || ''} onChange={(e: any) => set('national_id', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('clientForm.licenseNumber', 'License Number') + ' *', input: <InputField hasError={errors.license_number} type="text" value={client?.license_number || ''} onChange={(e: any) => set('license_number', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('clientForm.phone', 'Phone'), input: <InputField type="text" value={client?.phone || ''} onChange={(e: any) => set('phone', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('clientForm.dob', 'Date of Birth'), input: <InputField type="date" value={client?.dob || ''} onChange={(e: any) => set('dob', e.target.value)} /> },
        { label: 'Nationality', input: <InputField type="text" value={client?.nationality || ''} onChange={(e: any) => set('nationality', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('clientForm.address', 'Physical Address'), input: <InputField type="text" value={client?.address || ''} onChange={(e: any) => set('address', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
      ],
    },
    {
      title: `2 ${t('clientForm.documents', 'Documents')}`,
      icon: <FileText className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.idCardDoc', 'ID Card'), input: <DocField docType="id_card" label="ID Card" value={getDoc('id_card')} onChange={(v) => setDoc('id_card', v)} /> },
        { label: t('clientForm.licenseDoc', 'Driving License'), input: <DocField docType="license" label="License" value={getDoc('license')} onChange={(v) => setDoc('license', v)} /> },
        { label: t('clientForm.allInOneDoc', 'Master Contract/Composite'), input: <DocField docType="master_contract" label="Master Contract" value={getDoc('master_contract')} onChange={(v) => setDoc('master_contract', v)} /> },
      ],
    },
    {
      title: `3 ${t('clientForm.otherDetails', 'Other Details')}`,
      icon: <Calendar className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.licenseExpiry', 'License Expiry'), input: <InputField type="date" value={client?.license_expiry || ''} onChange={(e: any) => set('license_expiry', e.target.value)} /> },
        { label: t('clientForm.licenseIssue', 'License Issue Date'), input: <InputField type="date" value={client?.license_issue || ''} onChange={(e: any) => set('license_issue', e.target.value)} /> },
        { label: t('clientForm.email', 'Email Address'), input: <InputField type="email" value={client?.email || ''} onChange={(e: any) => set('email', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
      ],
    },
    {
      title: `4 ${t('clientForm.notesAndRating', 'Notes & Rating')}`,
      icon: <Star className="w-4 h-4" />,
      fields: [
        {
          label: <span className="inline-flex items-center gap-1.5">{t('clientForm.rating', 'Trust Ranking')}<button type="button" onClick={() => set('trust_rank', 0)} className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all" title="Reset"><RotateCcw className="w-3 h-3" /></button></span>,
          input: (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => set('trust_rank', num)}
                  className={`w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center transition-all ${
                    (client?.trust_rank || 0) >= num ? 'bg-amber-400 text-black border-amber-500' : 'bg-white text-slate-200'
                  }`}
                >
                  <Star className={`w-4 h-4 ${(client?.trust_rank || 0) >= num ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          ),
        },
        {
          label: '',
          input: (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={client?.is_blacklisted || false}
                onChange={(e) => set('is_blacklisted', e.target.checked)}
                className="w-4 h-4 border-2 border-slate-300 rounded text-red-600 focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-600">{t('crm.modal.markAsBlacklisted', 'Mark as Blacklisted')}</span>
            </label>
          ),
        },
        {
          label: t('clientForm.notes', 'Observations'),
          input: <TextareaField value={client?.notes || ''} onChange={(e: any) => set('notes', e.target.value)} placeholder={t('common.notesPlaceholder', 'Type any relevant observations or notes...')} rows={3} />,
        },
      ],
    },
  ];

  const renderCard = (section: typeof sections[0]) => (
    <div className="bg-blue-50 border border-slate-200 rounded-[12px] p-5 shadow-sm">
      {section.title && (
        <div className="flex items-center gap-2 text-xs font-semibold text-white pb-3 mb-4 border-b border-slate-200 bg-sky-600 -mx-5 -mt-5 px-5 pt-4 rounded-t-[12px]">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/25 text-white text-[10px] font-black leading-none shrink-0">{section.title.split(' ')[0]}</span>
          {section.icon && <span className="shrink-0 text-white">{section.icon}</span>}
          <span>{section.title.split(' ').slice(1).join(' ')}</span>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {section.fields.map((field, fIdx) => (
          <div key={fIdx} className="w-full flex flex-col">
            {field.label && (
              <span className="text-xs font-semibold text-slate-600 mb-1">
                {typeof field.label === 'string' && field.label.endsWith(' *')
                  ? <>{field.label.slice(0, -2)} <span className="text-red-500">*</span></>
                  : field.label}
              </span>
            )}
            {field.input}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {sections.map((section, i) => (
          <div key={i} className="w-full">
            {renderCard(section)}
          </div>
        ))}
      </div>
    </div>
  );
});

export default ClientForm;