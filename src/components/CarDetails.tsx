import { useTranslation } from 'react-i18next';
import { Settings, FileText, Calendar, Gauge, ExternalLink } from 'lucide-react';
import { FormattedCar } from '../types';
import { getDrivePreviewUrl } from '../lib/gas';

interface CardetailsProps {
  car: FormattedCar;
}

export default function Cardetails({ car }: CardetailsProps) {
  const { t } = useTranslation();
  const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString() : '---');

  const sections = [
    {
      title: `1 ${t('carDetailsView.basicInfo', 'Basic Info')}`,
      icon: <Settings className="w-4 h-4" />,
      fields: [
        { label: t('carDetailsView.fields.brand', 'Brand'), value: car.brand },
        { label: t('carDetailsView.fields.model', 'Model'), value: car.model },
        { label: t('carDetailsView.fields.plate', 'Plate'), value: car.plate },
        { label: t('carDetailsView.fields.color', 'Color'), value: car.color || '---' },
        { label: t('carDetailsView.fields.dailyRate', 'Daily Rate'), value: `$${car.daily_rate} / day` },
        { label: t('carDetailsView.fields.odometer', 'Odometer'), value: `${car.odometer?.toLocaleString() || '0'} km` },
        { label: t('carDetailsView.fields.status', 'Status'), value: car.status },
      ],
    },
    {
      title: `2 ${t('carForm.documents', 'Documents')}`,
      icon: <FileText className="w-4 h-4" />,
      fields: [
        { label: t('carForm.uploadImage', 'Vehicle Image'), url: (car.documents || []).find(d => d.doc_type === 'image')?.file_url },
        { label: t('carForm.registrationCard', 'Registration Card'), url: (car.documents || []).find(d => d.doc_type === 'registration_card')?.file_url },
        { label: t('carForm.insurance', 'Insurance'), url: (car.documents || []).find(d => d.doc_type === 'insurance')?.file_url },
        { label: t('carForm.vignette', 'Vignette'), url: (car.documents || []).find(d => d.doc_type === 'vignette')?.file_url },
        { label: t('carForm.pdfLabel', 'Documentation'), url: (car.documents || []).find(d => d.doc_type === 'documentation')?.file_url },
      ],
    },
    {
      title: `3 ${t('carForm.otherDetails', 'Other Details')}`,
      icon: <Calendar className="w-4 h-4" />,
      fields: [
        { label: t('carForm.firstUse', 'First Use'), value: formatDate(car.first_use_date) },
        { label: t('carForm.registrationExpir', 'Registration Expir'), value: formatDate(car.registration_expiry) },
        { label: t('carForm.insuranceExpir', 'Insurance Expir'), value: formatDate(car.insurance_expiry) },
        { label: t('carForm.vignetteExpir', 'Vignette Expir'), value: formatDate(car.vignette_expiry) },
        { label: t('carForm.transmission', 'Transmission'), value: car.transmission || '---' },
        { label: t('carForm.fuelType', 'Fuel Type'), value: car.fuel_type || '---' },
        { label: t('carForm.gpsSim', 'GPS Sim'), value: car.gps_sim || '---' },
        { label: t('carForm.seats', 'Seats'), value: car.seats?.toString() || '---' },
        {
          label: t('carForm.essentials', 'Essentials'),
          value: car.essentials?.length ? car.essentials.filter((e: any) => e.checked).map((e: any) => e.name).join(', ') : 'None',
        },
        { label: t('carForm.notes', 'Notes'), value: car.notes || '---' },
      ],
    },
    {
      title: `4 ${t('carForm.maintenance', 'Maintenance')}`,
      icon: <Gauge className="w-4 h-4" />,
      fields: car.intervals?.length
        ? car.intervals.map((i: any) => ({
            label: i.type,
            value: `${i.value || '---'}${i.lastCompleted ? ` (${t('carForm.lastCompleted', 'Last')}: ${formatDate(i.lastCompleted)})` : ''}`,
          }))
        : [{ label: t('carForm.maintenance', 'Maintenance'), value: t('carForm.noIntervals', 'No intervals set') }],
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
    <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          {[sections[0], sections[2], sections[3]].map((section, i) => (
            <div key={i}>{renderCard(section)}</div>
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-6">
          {[sections[1]].map((section, i) => (
            <div key={i}>{renderCard(section)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
