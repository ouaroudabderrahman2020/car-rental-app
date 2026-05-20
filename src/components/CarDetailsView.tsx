import { useTranslation } from 'react-i18next';
import { Gauge, Calendar, Shield, Settings, ClipboardList } from 'lucide-react';
import { FormattedCar } from '../types';

interface CarDetailsViewProps {
  car: FormattedCar;
}

export default function CarDetailsView({ car }: CarDetailsViewProps) {
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
        { label: t('carDetailsView.fields.status', 'Status'), value: car.status },
        { label: t('carDetailsView.fields.dailyRate', 'Daily Rate'), value: `$${car.daily_rate} / day` },
      ],
    },
    {
      title: t('carDetailsView.technicalDetails', 'Technical Details'),
      icon: <Gauge className="w-4 h-4" />,
      fields: [
        { label: t('carDetailsView.fields.fuelType', 'Fuel Type'), value: car.fuel_type || '---' },
        { label: t('carDetailsView.fields.transmission', 'Transmission'), value: car.transmission || '---' },
        { label: t('carDetailsView.fields.seats', 'Seats'), value: car.seats?.toString() || '---' },
        { label: t('carDetailsView.fields.odometer', 'Odometer'), value: `${car.odometer?.toLocaleString() || '0'} km` },
        { label: t('carDetailsView.fields.gpsSim', 'GPS SIM'), value: car.gps_sim || '---' },
      ],
    },
    {
      title: t('carDetailsView.registrationInsurance', 'Registration & Insurance'),
      icon: <Shield className="w-4 h-4" />,
      fields: [
        { label: t('carDetailsView.fields.registrationExpiry', 'Registration Expiry'), value: formatDate(car.registration_expiry) },
        { label: t('carDetailsView.fields.insuranceExpiry', 'Insurance Expiry'), value: formatDate(car.insurance_expiry) },
        { label: t('carDetailsView.fields.techInspectionExpiry', 'Tech Inspection Expiry'), value: formatDate(car.tech_inspection_expiry) },
        { label: t('carDetailsView.fields.taxRenewalExpiry', 'Tax Renewal Expiry'), value: formatDate(car.tax_renewal_expiry) },
        { label: t('carDetailsView.fields.vignetteExpiry', 'Vignette Expiry'), value: formatDate(car.vignette_expiry) },
      ],
    },
    {
      title: t('carDetailsView.dates', 'Dates'),
      icon: <Calendar className="w-4 h-4" />,
      fields: [
        { label: t('carDetailsView.fields.firstUseDate', 'First Use Date'), value: formatDate(car.first_use_date) },
        { label: t('carDetailsView.fields.addedOn', 'Added On'), value: formatDate(car.created_at) },
      ],
    },
    {
      title: t('carDetailsView.essentialsMaintenance', 'Essentials & Maintenance'),
      icon: <ClipboardList className="w-4 h-4" />,
      fields: [
        { label: t('carDetailsView.fields.essentials', 'Essentials'), value: car.essentials?.length ? car.essentials.filter((e: any) => e.checked).map((e: any) => e.name).join(', ') : 'None' },
        { label: t('carDetailsView.fields.maintenanceIntervals', 'Maintenance Intervals'), value: car.intervals?.length ? car.intervals.map((i: any) => `${i.type}: ${i.value}`).join(' | ') : 'None' },
        { label: t('carDetailsView.fields.notes', 'Notes'), value: car.notes || '---' },
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
                  <span className="text-sm font-semibold text-slate-900 whitespace-normal">
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
