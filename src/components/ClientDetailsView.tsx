import { User, Phone, Mail, MapPin, Calendar, CreditCard, FileText, Star, AlertCircle } from 'lucide-react';
import { Customer } from '../types';

interface ClientDetailsViewProps {
  client: Customer;
}

export default function ClientDetailsView({ client }: ClientDetailsViewProps) {
  const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString() : '---');

  const sections = [
    {
      title: 'Identity',
      icon: <User className="w-4 h-4" />,
      fields: [
        { label: 'Full Name', value: client.name },
        { label: 'National ID', value: client.national_id || '---' },
        { label: 'Phone', value: client.phone },
        { label: 'Email', value: client.email || '---' },
        { label: 'Date of Birth', value: formatDate(client.dob) },
        { label: 'Nationality', value: client.nationality || '---' },
        { label: 'Address', value: client.address || '---' },
      ],
    },
    {
      title: 'License',
      icon: <CreditCard className="w-4 h-4" />,
      fields: [
        { label: 'License Number', value: client.license_number },
        { label: 'License Issue Date', value: formatDate(client.license_issue) },
        { label: 'License Expiry', value: formatDate(client.license_expiry) },
        { label: 'ID Card Number', value: client.id_card_number },
      ],
    },
    {
      title: 'Documents',
      icon: <FileText className="w-4 h-4" />,
      fields: [
        { label: 'ID Card Document', value: client.drive_id_photo ? 'Uploaded' : '---' },
        { label: 'License Front Photo', value: client.drive_license_front_photo ? 'Uploaded' : '---' },
        { label: 'License Back Photo', value: client.drive_license_back_photo ? 'Uploaded' : '---' },
        { label: 'Master Contract', value: client.drive_contract_doc_id ? 'Uploaded' : '---' },
      ],
    },
    {
      title: 'Status & Notes',
      icon: <Star className="w-4 h-4" />,
      fields: [
        { label: 'Trust Ranking', value: client.trust_rank > 0 ? `${'★'.repeat(client.trust_rank)}${'☆'.repeat(5 - client.trust_rank)}` : '---' },
        { label: 'Blacklisted', value: client.is_blacklisted ? 'Yes' : 'No' },
        { label: 'Added On', value: formatDate(client.created_at) },
        { label: 'Notes', value: client.notes || '---' },
      ],
    },
  ];

  return (
    <div className="p-1 sm:p-2 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
      {client.is_blacklisted && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-xs font-black uppercase tracking-widest text-red-700">Blacklisted</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, sIdx) => (
          <div
            key={sIdx}
            className="bg-slate-50/80 border border-slate-200/85 rounded-xl p-5 sm:p-6 shadow-sm flex-1 min-w-[320px]"
          >
            {section.title && (
              <div className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-slate-900 uppercase pb-3 mb-4 border-b border-slate-200">
                {section.icon && <span className="shrink-0 text-indigo-600">{section.icon}</span>}
                {section.title}
              </div>
            )}

            <div className="flex flex-col gap-0">
              {section.fields.map((field, fIdx) => (
                <div
                  key={fIdx}
                  className="flex items-baseline py-2 border-b border-slate-100 last:border-0 gap-2 w-full min-w-0"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap shrink-0">
                    {field.label} :
                  </span>
                  <span className="text-sm font-semibold text-slate-900 break-words flex-grow min-w-0">
                    {field.value}
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
