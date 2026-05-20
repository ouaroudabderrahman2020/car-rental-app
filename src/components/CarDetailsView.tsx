import { Gauge, Calendar, Shield, Settings, ClipboardList } from 'lucide-react';
import { FormattedCar } from '../types';

interface CarDetailsViewProps {
  car: FormattedCar;
}

export default function CarDetailsView({ car }: CarDetailsViewProps) {
  const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString() : '---');

  const sections = [
    {
      title: 'Basic Info',
      icon: <Settings className="w-4 h-4" />,
      fields: [
        { label: 'Brand', value: car.brand },
        { label: 'Model', value: car.model },
        { label: 'Plate', value: car.plate },
        { label: 'Color', value: car.color || '---' },
        { label: 'Status', value: car.status },
        { label: 'Daily Rate', value: `$${car.daily_rate} / day` },
      ],
    },
    {
      title: 'Technical Details',
      icon: <Gauge className="w-4 h-4" />,
      fields: [
        { label: 'Fuel Type', value: car.fuel_type || '---' },
        { label: 'Transmission', value: car.transmission || '---' },
        { label: 'Seats', value: car.seats?.toString() || '---' },
        { label: 'Odometer', value: `${car.odometer?.toLocaleString() || '0'} km` },
        { label: 'GPS SIM', value: car.gps_sim || '---' },
      ],
    },
    {
      title: 'Registration & Insurance',
      icon: <Shield className="w-4 h-4" />,
      fields: [
        { label: 'Registration Expiry', value: formatDate(car.registration_expiry) },
        { label: 'Insurance Expiry', value: formatDate(car.insurance_expiry) },
        { label: 'Tech Inspection Expiry', value: formatDate(car.tech_inspection_expiry) },
        { label: 'Tax Renewal Expiry', value: formatDate(car.tax_renewal_expiry) },
        { label: 'Vignette Expiry', value: formatDate(car.vignette_expiry) },
      ],
    },
    {
      title: 'Dates',
      icon: <Calendar className="w-4 h-4" />,
      fields: [
        { label: 'First Use Date', value: formatDate(car.first_use_date) },
        { label: 'Added On', value: formatDate(car.created_at) },
      ],
    },
    {
      title: 'Essentials & Maintenance',
      icon: <ClipboardList className="w-4 h-4" />,
      fields: [
        { label: 'Essentials', value: car.essentials?.length ? car.essentials.filter((e: any) => e.checked).map((e: any) => e.name).join(', ') : 'None' },
        { label: 'Maintenance Intervals', value: car.intervals?.length ? car.intervals.map((i: any) => `${i.type}: ${i.value}`).join(' | ') : 'None' },
        { label: 'Notes', value: car.notes || '---' },
      ],
    },
  ];

  return (
    <div className="p-1 sm:p-2 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
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
