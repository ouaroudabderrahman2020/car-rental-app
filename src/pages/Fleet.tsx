import { Plus, Car as CarIcon, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import CarModal from '../components/CarModal';
import { PageHeader } from '../components/PageHeader';
import Section2 from '../components/Section2';
/* removed FormSection import */
import { supabase } from '../lib/supabase';
import { useStatus } from '../contexts/StatusContext';
import { Car, FormattedCar } from '../types';
import { CAR_STATUSES } from '../constants';

export default function Fleet() {
  const { t, i18n } = useTranslation();
  const { setStatus } = useStatus();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<FormattedCar | null>(null);
  const [fleetData, setFleetData] = useState<FormattedCar[]>([]);
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
        .select('id, brand, model, plate, color, fuel_type, transmission, odometer, daily_rate, status, starting_fuel_level, gps_sim, seats, damage_notes, image_url, documentation_url, registration_expiry, insurance_expiry, tech_inspection_expiry, tax_renewal_expiry, created_at, updated_at, essentials, intervals')
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
              className="px-6 py-2.5 bg-primary text-white font-black text-fluid-sm uppercase tracking-[0.2em] industrial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('fleet.addCar', 'ADD NEW CAR')}
            </button>
          }
          className="p-6 md:p-10 border-b border-slate-200"
        />
        <CarModal 
          isOpen={isModalOpen}
          mode={modalMode}
          carData={selectedCar}
          onClose={() => {
            setIsModalOpen(false);
            fetchFleet();
          }}
        />

      {/* Fleet Grid */}
      <div className="py-lg">
        <div className="max-w-[1440px] mx-auto">
          <Section2 title={t('fleet.inventory', 'Vehicle Inventory')}>
              <div className="w-full flex flex-col gap-8">
                {/* Action Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative group min-w-[200px] md:min-w-[300px] flex-grow md:flex-grow-0">
                      <input 
                        type="text" 
                        placeholder={t('common.search', 'Filter by brand, model or plate...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-ink text-sm focus:bg-white focus:border-primary transition-all outline-none"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    {/* Status Filter */}
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 text-ink text-sm outline-none focus:border-primary transition-all cursor-pointer min-w-[140px]"
                    >
                      <option value="all">{t('common.allStatus', 'All Status')}</option>
                      {CAR_STATUSES.map(st => (
                        <option key={st} value={st}>
                          {t(`fleet.${st.toLowerCase().replace(/\s+/g, '')}`, st)}
                        </option>
                      ))}
                    </select>
                  </div>
                  </div>
              </div>

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
                ) : filteredFleet.length === 0 ? (
                  <div className="col-span-full py-20 bg-white border border-slate-100 shadow-sm text-center">
                    <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">{t('common.noData', 'No vehicles found in fleet.')}</p>
                  </div>
                ) : (
                  filteredFleet.map((car) => (
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
          </Section2>
          </div>
        </div>
      </div>
    </Layout>
  );
}
