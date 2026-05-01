import { Plus, Car as CarIcon, Loader2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import AddCarModal from '../components/AddCarModal';
import { SectionHeader } from '../components/SectionHeader';
import CarDetailsModal from '../components/CarDetailsModal';
import { supabase } from '../lib/supabase';
import { gasService } from '../services/gasService';
import { useStatus } from '../contexts/StatusContext';
import { Car } from '../types';

interface FormattedCar extends Car {
  name: string;
  rate: string;
  statusColor: string;
  needsMaintenance: boolean;
  image: string;
}

export default function Fleet() {
  const { t, i18n } = useTranslation();
  const { setStatus } = useStatus();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<FormattedCar | null>(null);
  const [fleetData, setFleetData] = useState<FormattedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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
        const formattedData: FormattedCar[] = data.map(car => ({
          ...car,
          name: `${car.brand} ${car.model}`,
          rate: `${formatCurrency(car.daily_rate)} ${t('common.perDay')}`,
          statusColor: car.status === 'Available' ? 'bg-primary' : 
                       car.status === 'In Maintenance' ? 'bg-workshop-amber' : 
                       car.status === 'Rented' ? 'bg-indigo-600' : 'bg-slate-500',
          needsMaintenance: car.odometer >= 15000,
          image: car.image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800'
        }));
        setFleetData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching fleet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setStatus(t('tools.imageToPdfTools.processing'), 'processing', 0);
    const { success, error } = await gasService.exportData('fleet', fleetData);
    if (!success) {
      setStatus(t('common.exportError'), 'error');
      alert(`${t('common.exportError')}: ${error}`);
    } else {
      setStatus(t('common.exportSuccess'), 'success');
      alert(t('common.exportSuccess'));
    }
    setIsExporting(false);
  };

  useEffect(() => {
    fetchFleet();
  }, [i18n.language]);

  const handleOpenDetails = (car: FormattedCar) => {
    setSelectedCar(car);
    setIsDetailsModalOpen(true);
  };

  return (
    <Layout title={t('nav.fleet')}>
      <div className="w-full bg-white min-h-full pb-10">
        <AddCarModal 
          isOpen={isAddModalOpen} 
          onClose={() => {
            setIsAddModalOpen(false);
            fetchFleet();
          }} 
        />
        {selectedCar && (
          <CarDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              fetchFleet();
            }}
            carData={selectedCar}
          />
        )}

      {/* Fleet Grid */}
      <section className="py-lg">
        <div className="max-w-[1440px] mx-auto px-margin v-section-gap">
          {/* Action Toolbar */}
          <SectionHeader 
            title={t('fleet.inventory', 'Vehicle Inventory')}
            actions={
              <>
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-6 py-2.5 bg-midnight-ink text-white font-bold text-fluid-sm uppercase tracking-widest industrial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 border border-white/10 disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExporting ? t('common.loading', 'EXPORTING...') : t('common.export', 'EXPORT TO SHEETS')}
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-2.5 bg-primary text-white font-black text-fluid-sm uppercase tracking-[0.2em] industrial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('fleet.addCar', 'ADD NEW CAR')}
                </button>
              </>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 shadow-sm h-[400px] flex flex-col animate-pulse">
                  <div className="h-1/2 bg-slate-200"></div>
                  <div className="p-6 space-y-4 flex-grow">
                    <div className="h-6 bg-slate-200 w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 w-1/4"></div>
                      <div className="h-4 bg-slate-200 w-1/2"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 w-1/4"></div>
                      <div className="h-6 bg-slate-200 w-1/3"></div>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-200 w-full mt-auto"></div>
                </div>
              ))
            ) : fleetData.length === 0 ? (
              <div className="col-span-full py-20 bg-white border border-slate-100 shadow-sm text-center">
                <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">{t('common.noData', 'No vehicles found in fleet.')}</p>
              </div>
            ) : (
              fleetData.map((car) => (
                <div 
                  key={car.id} 
                  onClick={() => handleOpenDetails(car)}
                  className="car-card bg-white border border-slate-200 shadow-sm group flex flex-col h-full cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="aspect-[3/4] overflow-hidden flex flex-col">
                    <div className="h-1/2 overflow-hidden bg-slate-100 relative">
                      <img 
                        alt={car.name} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                        src={car.image}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = ''; // Clear broken src
                          (e.target as HTMLImageElement).className = 'hidden';
                        }}
                      />
                      {car.needsMaintenance && (
                        <div className="absolute top-4 start-4 px-3 py-1 bg-workshop-amber text-white text-fluid-sm font-black uppercase tracking-widest industrial-shadow">
                          {t('common.maintenance', 'Service Due')}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-0 transition-opacity pointer-events-none">
                        <CarIcon className="w-16 h-16 text-midnight" />
                      </div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-fluid-base text-ink leading-tight mb-4">{car.name}</h3>
                        <div className="space-y-3">
                          <div className="flex flex-col">
                            <span className="text-ink uppercase font-bold text-fluid-sm tracking-widest leading-none mb-1 opacity-70">{t('fleet.plateNumber', 'Plate Number')}</span>
                            <span className="font-semibold text-midnight text-fluid-sm">{car.plate}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-ink uppercase font-bold text-fluid-sm tracking-widest leading-none mb-1 opacity-70">{t('fleet.dailyRate', 'Daily Rate')}</span>
                            <span className="text-primary font-bold text-fluid-base">
                              {t('common.price')}: ${car.daily_rate} {t('common.perDay')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`h-2 ${car.statusColor} w-full mt-auto cursor-help`} 
                      title={car.status}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  </Layout>
);
}
