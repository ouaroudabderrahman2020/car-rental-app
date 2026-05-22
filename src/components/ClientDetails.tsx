import { useTranslation } from 'react-i18next';
import { User, CreditCard, FileText, Star, AlertCircle, Calendar } from 'lucide-react';
import { Customer } from '../types';

interface ClientDetailsProps {
  client: Customer;
}

export default function ClientDetails({ client }: ClientDetailsProps) {
  const { t } = useTranslation();
  const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString() : '---');

  const sections = [
    {
      title: t('clientForm.identity', 'Identity'),
      icon: <User className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.fullName', 'Full Name'), value: client.name },
        { label: t('clientForm.nationalId', 'National ID'), value: client.national_id || client.id_card_number || '---' },
        { label: t('clientForm.phone', 'Phone'), value: client.phone },
        { label: t('clientForm.email', 'Email'), value: client.email || '---' },
        { label: t('clientForm.dob', 'Date of Birth'), value: formatDate(client.dob) },
        { label: 'Nationality', value: client.nationality || '---' },
        { label: t('clientForm.address', 'Address'), value: client.address || '---' },
      ],
    },
    {
      title: t('clientForm.license', 'License'),
      icon: <CreditCard className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.licenseNumber', 'License Number'), value: client.license_number },
        { label: t('clientForm.licenseIssue', 'License Issue Date'), value: formatDate(client.license_issue) },
        { label: t('clientForm.licenseExpiry', 'License Expiry'), value: formatDate(client.license_expiry) },
        { label: 'ID Card Number', value: client.id_card_number || '---' },
      ],
    },
    {
      title: t('clientForm.documents', 'Documents'),
      icon: <FileText className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.idCardDoc', 'ID Card'), value: client.drive_id_photo ? t('common.attached', 'Attached') : '---' },
        { label: t('clientForm.licenseDoc', 'Driving License'), value: client.drive_license_front_photo ? t('common.attached', 'Attached') : '---' },
        { label: 'License Back Photo', value: client.drive_license_back_photo ? t('common.attached', 'Attached') : '---' },
        { label: t('clientForm.allInOneDoc', 'Master Contract'), value: client.drive_contract_doc_id ? t('common.attached', 'Attached') : '---' },
      ],
    },
    {
      title: t('clientForm.notesAndRating', 'Status & Notes'),
      icon: <Star className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.rating', 'Trust Ranking'), value: client.trust_rank > 0 ? `${'★'.repeat(client.trust_rank)}${'☆'.repeat(5 - client.trust_rank)}` : '---' },
        { label: t('crm.modal.markAsBlacklisted', 'Blacklisted'), value: client.is_blacklisted ? 'Yes' : 'No' },
        { label: 'Added On', value: formatDate(client.created_at) },
        { label: t('clientForm.notes', 'Notes'), value: client.notes || '---' },
      ],
    },
  ];

  return (
    <>
      {client.is_blacklisted && (
        <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-[12px]">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-xs font-black uppercase tracking-widest text-red-700">Blacklisted</span>
        </div>
      )}
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
                  <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-[12px] px-3 py-1.5 inline-block">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
    </>
  );
}
