import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, FileText, Calendar, Star, AlertCircle, ExternalLink } from 'lucide-react';
import { Customer } from '../types';
import { getDrivePreviewUrl } from '../lib/gas';

interface ClientDetailsProps {
  client: Customer;
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
    <div className="bg-blue-50 border border-slate-200 rounded-[12px] p-5 shadow-sm">
      {section.title && (
        <div className="flex items-center gap-2 text-xs font-semibold text-white pb-3 mb-4 border-b border-slate-200 bg-sky-600 -mx-5 -mt-5 px-5 pt-4 rounded-t-[12px]">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/25 text-white text-[10px] font-black leading-none shrink-0">{section.title.split(' ')[0]}</span>
          {section.icon && <span className="shrink-0 text-white">{section.icon}</span>}
          <span>{section.title.split(' ').slice(1).join(' ')}</span>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {section.fields.map((field: any, fIdx) => (
          <div key={fIdx} className="w-full flex flex-col">
            {'url' in field ? (
              field.url ? (
                <a
                  href={getDrivePreviewUrl(field.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-sm font-semibold text-blue-700 bg-blue-100 border border-blue-200 rounded-[12px] px-3 py-1.5 inline-flex items-center gap-2 hover:bg-blue-200 transition-colors"
                >
                  {field.label}
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-auto" />
                </a>
              ) : (
                <span className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-[12px] px-3 py-1.5 inline-block">
                  {field.label}
                </span>
              )
            ) : (
              <>
                <span className="text-xs font-semibold text-slate-600 mb-1">
                  {field.label}
                </span>
                <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-[12px] px-3 py-1.5 inline-block">
                  {field.value}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [colLeft, setColLeft] = useState<typeof sections>([]);
  const [colRight, setColRight] = useState<typeof sections>([]);
  const [layoutReady, setLayoutReady] = useState(false);

  useLayoutEffect(() => {
    if (layoutReady) return;
    const heights = cardRefs.current.map(r => r?.offsetHeight || 0);
    if (heights.some(h => h === 0)) return;
    const left: typeof sections = [];
    const right: typeof sections = [];
    let leftH = 0, rightH = 0;
    sections.forEach((s, i) => {
      if (i === 0) { left.push(s); leftH += heights[i]; }
      else if (i === 1) { right.push(s); rightH += heights[i]; }
      else if (leftH <= rightH) { left.push(s); leftH += heights[i]; }
      else { right.push(s); rightH += heights[i]; }
    });
    setColLeft(left);
    setColRight(right);
    setLayoutReady(true);
  }, [layoutReady, sections]);

  if (!layoutReady) {
    return (
      <>
        {client.is_blacklisted && (
          <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-[12px]">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-xs font-black uppercase tracking-widest text-red-700">Blacklisted</span>
          </div>
        )}
        <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
          <div className="flex gap-6">
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              {sections.map((section, i) => (
                <div key={i} ref={el => cardRefs.current[i] = el}>{renderCard(section)}</div>
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-6 min-w-0" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {client.is_blacklisted && (
        <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-[12px]">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-xs font-black uppercase tracking-widest text-red-700">Blacklisted</span>
        </div>
      )}
      <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {colLeft.map((section, i) => (
              <div key={i}>{renderCard(section)}</div>
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {colRight.map((section, i) => (
              <div key={i}>{renderCard(section)}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
