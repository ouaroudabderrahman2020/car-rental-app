import { useTranslation } from 'react-i18next';
import { User, FileText, Calendar, Star, AlertCircle, ExternalLink } from 'lucide-react';
import { Client } from '../types';
import { getDrivePreviewUrl } from '../lib/gas';

interface ClientDetailsProps {
  client: Client;
}

export default function ClientDetails({ client }: ClientDetailsProps) {
  const { t } = useTranslation();
  const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString() : '---');

  const sections = [
    {
      title: `1 ${t('clientForm.identity', 'Identity')}`,
      icon: <User className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.fullName', 'Full Name'), value: client.name },
        { label: t('clientForm.nationalId', 'National ID'), value: client.national_id || client.id_card_number || '---' },
        { label: t('clientForm.licenseNumber', 'License Number'), value: client.license_number || '---' },
        { label: t('clientForm.phone', 'Phone'), value: client.phone || '---' },
        { label: t('clientForm.dob', 'Date of Birth'), value: formatDate(client.dob) },
        { label: 'Nationality', value: client.nationality || '---' },
        { label: t('clientForm.address', 'Physical Address'), value: client.address || '---' },
      ],
    },
    {
      title: `2 ${t('clientForm.documents', 'Documents')}`,
      icon: <FileText className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.idCardDoc', 'ID Card'), url: (client.documents || []).find(d => d.doc_type === 'id_card')?.file_url },
        { label: t('clientForm.licenseDoc', 'Driving License'), url: (client.documents || []).find(d => d.doc_type === 'license')?.file_url },
        { label: t('clientForm.allInOneDoc', 'Master Contract/Composite'), url: (client.documents || []).find(d => d.doc_type === 'master_contract')?.file_url },
      ],
    },
    {
      title: `3 ${t('clientForm.otherDetails', 'Other Details')}`,
      icon: <Calendar className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.licenseExpiry', 'License Expiry'), value: formatDate(client.license_expiry) },
        { label: t('clientForm.licenseIssue', 'License Issue Date'), value: formatDate(client.license_issue) },
        { label: t('clientForm.email', 'Email Address'), value: client.email || '---' },
      ],
    },
    {
      title: `4 ${t('clientForm.notesAndRating', 'Notes & Rating')}`,
      icon: <Star className="w-4 h-4" />,
      fields: [
        { label: t('clientForm.rating', 'Trust Ranking'), value: client.trust_rank > 0 ? `${'★'.repeat(client.trust_rank)}${'☆'.repeat(5 - client.trust_rank)}` : '---' },
        { label: t('crm.modal.markAsBlacklisted', 'Blacklisted'), value: client.is_blacklisted ? 'Yes' : 'No' },
        { label: t('clientForm.notes', 'Observations'), value: client.notes || '---' },
      ],
    },
  ];

  const renderCard = (section: typeof sections[0]) => (
    <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm">
      {section.title && (
        <div className="flex items-center gap-2 text-xs font-semibold text-white bg-sky-600 px-5 py-3.5">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/25 text-white text-[10px] font-black leading-none shrink-0">{section.title.split(' ')[0]}</span>
          {section.icon && <span className="shrink-0 text-white">{section.icon}</span>}
          <span>{section.title.split(' ').slice(1).join(' ')}</span>
        </div>
      )}
      <div className="flex flex-col">
        {section.fields.map((field: any, fIdx) => (
          <div key={fIdx} className={`w-full flex items-start gap-2.5 px-5 py-3 ${fIdx % 2 === 0 ? 'bg-slate-50/70' : ''}`}>
            <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
            {'url' in field ? (
              field.url ? (
                <a
                  href={getDrivePreviewUrl(field.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm font-semibold text-blue-700 inline-flex items-center gap-2 hover:underline"
                >
                  {field.label}
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-auto" />
                </a>
              ) : (
                <span className="flex-1 text-sm font-semibold text-slate-900">
                  {field.label}
                </span>
              )
            ) : (
              <div className="flex-1 flex items-baseline justify-between gap-4">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  {field.label}
                </span>
                <span className="text-sm font-bold text-slate-900 text-right">
                  {field.value}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {client.is_blacklisted && (
        <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-[12px]">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-xs font-black uppercase tracking-widest text-red-700">Blacklisted</span>
        </div>
      )}
      <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            {[sections[0], sections[2]].map((section, i) => (
              <div key={i}>{renderCard(section)}</div>
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-6">
            {[sections[1], sections[3]].map((section, i) => (
              <div key={i}>{renderCard(section)}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}