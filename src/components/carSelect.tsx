import { useTranslation } from 'react-i18next';
import { X, Car as CarIcon } from 'lucide-react';
import BaseModal from './BaseModal';
import { getDriveImageUrl } from '../lib/gas';

interface CarSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: any[];
  selectedCarId: string | null;
  onSelect: (car: any) => void;
}

export default function CarSelectModal({ isOpen, onClose, cars, selectedCarId, onSelect }: CarSelectModalProps) {
  const { t } = useTranslation();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('reservations.form.selectCar', 'Select Car')}
    >
      <div className="p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {cars.map(car => {
            const carImage = (() => { const img = (car.documents || []).find((d: any) => d.doc_type === 'image'); return img?.file_url ? getDriveImageUrl(img.file_url) : null; })();
            const isSelected = selectedCarId === car.id;
            const needsMaint = car.status === 'In Maintenance' || car.status === 'Workshop';
            return (
              <div
                key={car.id}
                onClick={() => onSelect(car)}
                className={`bg-white rounded-2xl shadow-sm border group flex flex-col h-full cursor-pointer hover:shadow-md hover:border-slate-200 transition-all duration-300 overflow-hidden ${
                  isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-100'
                }`}
              >
                <div className="aspect-video overflow-hidden bg-slate-50 relative">
                  {carImage ? (
                    <>
                      <img
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        src={carImage}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full items-center justify-center bg-slate-50 hidden absolute inset-0">
                        <CarIcon className="w-8 h-8 text-slate-200" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                      <CarIcon className="w-8 h-8 text-slate-200" />
                    </div>
                  )}
                  {needsMaint && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-workshop-amber/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-tight rounded-lg shadow-sm z-10">
                      SERVICE
                    </div>
                  )}
                </div>
                <div className="p-5 grow flex flex-col justify-center gap-3">
                  <h3 className="font-bold text-sm text-slate-900 leading-tight truncate">
                    {car.brand} {car.model}
                  </h3>
                  <div className="inline-block self-start px-2 py-0.5 bg-sky-100 border border-sky-300 rounded-lg text-[15px] font-black text-black tracking-[0.15em] font-mono antialiased">
                    {car.plate}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-black">
                      ${car.daily_rate} / <span className="text-[10px] text-slate-400 font-bold">DAY</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BaseModal>
  );
}
