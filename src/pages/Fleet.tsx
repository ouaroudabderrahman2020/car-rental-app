import { Plus, Car as CarIcon, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import CarModal from '../components/CarModal';
import { PageHeader } from '../components/PageHeader';
import Section2 from '../components/Section2';
/* removed FormSection import */
import { supabase } from '../lib/supabase';
import { getDriveImageUrl } from '../lib/gas';
import { useStatus } from '../contexts/StatusContext';
import { Car, FormattedCar } from '../types';
import { CAR_STATUSES } from '../constants';

export default function Fleet() {
  const { t, i18n } = useTranslation();
  const { setStatus } = useStatus();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<FormattedCar | null>(null);
  const [fleetData, setFleetData] = useState<FormattedCar[]>(() => {
    const cached = localStorage.getItem('fleet_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(val);
  };

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        console.log('Fetched fleet data:', data.map(c => ({ id: c.id, img: c.image_url })));
        const formattedData: FormattedCar[] = data.map(car => {
          const transformedImage = car.image_url ? getDriveImageUrl(car.image_url) : null;
          console.log(`🚗 Car ${car.brand} ${car.model} (${car.plate}):`, {
            original_url: car.image_url,
            transformed_url: transformedImage,
            has_image: !!transformedImage
          });
          return {
            ...car,
            name: `${car.brand} ${car.model}`,
            rate: `${formatCurrency(car.daily_rate)} ${t('common.perDay')}`,
            statusColor: car.status === 'Available' ? 'bg-primary' : 
                         car.status === 'In Maintenance' ? 'bg-workshop-amber' : 
                         car.status === 'Rented' ? 'bg-indigo-600' : 'bg-slate-500',
            needsMaintenance: car.status === 'In Maintenance' || car.status === 'Workshop',
            image: transformedImage
          };
        });
        setFleetData(formattedData);
        localStorage.setItem('fleet_cache', JSON.stringify(formattedData));
      }
    } catch (error) {
      console.error('Error fetching fleet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, [i18n.language]);

  const handleOpenDetails = (car: FormattedCar) => {
    setSelectedCar(car);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleAddCar = () => {
    setSelectedCar(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOptimisticUpdate = (car: any) => {
    // Generate derived fields for FormattedCar
    const formatted: FormattedCar = {
      ...car,
      id: car.id || `temp-${Date.now()}`,
      name: `${car.brand} ${car.model}`,
      rate: `${formatCurrency(car.daily_rate)} ${t('common.perDay')}`,
      statusColor: car.status === 'Available' ? 'bg-primary' : 
                   car.status === 'In Maintenance' ? 'bg-workshop-amber' : 
                   car.status === 'Rented' ? 'bg-indigo-600' : 'bg-slate-500',
      needsMaintenance: car.status === 'In Maintenance' || car.status === 'Workshop',
      image: car.image_url ? getDriveImageUrl(car.image_url) : null
    };

    setFleetData(prev => {
      const exists = prev.findIndex(c => c.id === formatted.id);
      let next;
      if (exists > -1) {
        next = [...prev];
        next[exists] = formatted;
      } else {
        next = [formatted, ...prev];
      }
      localStorage.setItem('fleet_cache', JSON.stringify(next));
      return next;
    });
  };

  const handleOptimisticDelete = (id: string) => {
    setFleetData(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem('fleet_cache', JSON.stringify(next));
      return next;
    });
  };

  const filteredFleet = useMemo(() => {
    return fleetData.filter(car => {
      const matchesSearch = car.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            car.plate.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || car.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [fleetData, searchQuery, statusFilter]);

  return (
    <Layout>
      <div className="w-full bg-white min-h-full pb-10">
        <PageHeader 
          title={t('nav.fleet')} 
          actions={
            <button 
              onClick={handleAddCar}
              className="header-btn"
            >
              <Plus className="w-4 h-4" />
              {t('fleet.addCar', 'ADD NEW CAR')}
            </button>
          }
          className="p-6 md:p-10"
        />
        <CarModal 
          isOpen={isModalOpen}
          mode={modalMode}
          carData={selectedCar}
          onOptimisticUpdate={handleOptimisticUpdate}
          onOptimisticDelete={handleOptimisticDelete}
          onClose={() => {
            setIsModalOpen(false);
          }}
        />

      {/* Fleet Grid */}
      <div className="pt-6 pb-12">
        <div className="max-w-[1440px] mx-auto">
          <Section2>
            <div className="w-full flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {loading && fleetData.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white border-2 border-black flex flex-col items-center justify-center h-[400px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="font-black uppercase tracking-[0.3em] text-midnight-ink text-xs">LOADING...</span>
                      </div>
                    </div>
                  ))
                ) : filteredFleet.length === 0 ? (
                  <div className="col-span-full py-20 bg-white border border-slate-100 shadow-sm text-center">
                    <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">{t('common.noData', 'No vehicles found in fleet.')}</p>
                  </div>
                ) : (
                  filteredFleet.map((car) => (
                    <div 
                      key={car.id} 
                      onClick={() => handleOpenDetails(car)}
                      className="car-card bg-white rounded-2xl shadow-sm border border-slate-100 group flex flex-col h-full cursor-pointer hover:shadow-md hover:border-slate-200 transition-all duration-300 overflow-hidden"
                    >
                      <div className="aspect-video overflow-hidden bg-slate-50 relative">
                        {car.image ? (
                          <>
                            <img 
                              alt={car.name} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                              src={car.image}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              onLoad={() => {
                                console.log(`Image loaded successfully for ${car.name}`);
                              }}
                              onError={(e) => {
                                console.error(`❌ Failed to load image for ${car.name} (${car.plate}):`, {
                                  attempted_src: car.image,
                                  original_database_url: car.image_url,
                                  error: 'Image failed to load from Google Drive. Possible causes: 1) File not publicly shared, 2) File deleted, 3) URL format issue'
                                });
                                // Hide the failed image
                                (e.target as HTMLImageElement).style.display = 'none';
                                // Show fallback icon
                                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 hidden absolute inset-0">
                              <CarIcon className="w-8 h-8 text-slate-200" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50">
                            <CarIcon className="w-8 h-8 text-slate-200" />
                          </div>
                        )}
                        {car.needsMaintenance && (
                          <div className="absolute top-3 left-3 px-2 py-1 bg-workshop-amber/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-tight rounded-lg shadow-sm z-10">
                            {t('common.maintenance', 'SERVICE')}
                          </div>
                        )}
                      </div>

                      <div className="p-5 grow flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-slate-900 leading-tight truncate">
                            {car.name}
                          </h3>
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                            {car.plate}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-sm font-black text-black">
                            ${car.daily_rate} / <span className="text-[10px] text-slate-400 font-bold">{t('common.day', 'DAY')}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
            </div>
          </Section2>
          </div>
        </div>
      </div>
    </Layout>
  );
}
