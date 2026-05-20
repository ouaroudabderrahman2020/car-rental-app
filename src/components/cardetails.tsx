import { useTranslation } from 'react-i18next';
import { Settings, FileText, Calendar, Gauge } from 'lucide-react';
import { FormattedCar } from '../types';

interface CardetailsProps {
  car: FormattedCar;
}

export default function Cardetails({ car }: CardetailsProps) {
  const { t } = useTranslation();
  const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString() : '---');

  const sections = [
    {
      title: t('carDetailsView.basicInfo', 'Basic Info'),
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
      title: t('carForm.documents', 'Documents'),
      icon: <FileText className="w-4 h-4" />,
      fields: [
        { label: t('carForm.uploadImage', 'Vehicle Image'), value: car.image_url ? t('common.attached', 'Attached') : '---' },
        { label: t('carForm.registrationCard', 'Registration Card'), value: car.registration_card_url ? t('common.attached', 'Attached') : '---' },
        { label: t('carForm.insurance', 'Insurance'), value: car.insurance_url ? t('common.attached', 'Attached') : '---' },
        { label: t('carForm.vignette', 'Vignette'), value: car.vignette_url ? t('common.attached', 'Attached') : '---' },
        { label: t('carForm.pdfLabel', 'Documentation'), value: car.documentation_url ? t('common.attached', 'Attached') : '---' },
      ],
    },
    {
      title: t('carForm.otherDetails', 'Other Details'),
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
      title: t('carForm.maintenance', 'Maintenance'),
      icon: <Gauge className="w-4 h-4" />,
      fields: car.intervals?.length
        ? car.intervals.map((i: any) => ({
            label: i.type,
            value: `${i.value || '---'}${i.lastCompleted ? ` (${t('carForm.lastCompleted', 'Last')}: ${formatDate(i.lastCompleted)})` : ''}`,
          }))
        : [{ label: t('carForm.maintenance', 'Maintenance'), value: t('carForm.noIntervals', 'No intervals set') }],
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
                  <span className="text-sm font-semibold text-slate-900">
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
