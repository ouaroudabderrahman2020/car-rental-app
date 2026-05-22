import { Plus, Car as CarIcon, Loader2, Edit, Check, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import CarForm from '../components/CarForm';
import BaseModal from '../components/BaseModal';
import Cardetails from '../components/CarDetails';
import { PageHeader } from '../components/PageHeader';
import Section2 from '../components/Section2';
import { supabase } from '../lib/supabase';
import { getDriveImageUrl } from '../lib/gas';
import { useStatus } from '../contexts/StatusContext';
import { useNotification } from '../contexts/NotificationContext';
import { FormattedCar, CarDocument } from '../types';
import { uploadFile } from '../lib/storage';

export default function Fleet() {
  const { t, i18n } = useTranslation();
  const { setStatus } = useStatus();
  const { confirm: customConfirm } = useNotification();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<FormattedCar | null>(null);
  const [formData, setFormData] = useState<Partial<FormattedCar>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsCar, setDetailsCar] = useState<FormattedCar | null>(null);
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
        .select('*, car_documents(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: FormattedCar[] = data.map(car => {
          const docs = (car as any).car_documents || [];
          delete (car as any).car_documents;
          const imageDoc = docs.find((d: any) => d.doc_type === 'image');
          const transformedImage = imageDoc?.file_url ? getDriveImageUrl(imageDoc.file_url) : null;
          return {
            ...car,
            documents: docs,
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
    setDetailsCar(car);
    setIsDetailsOpen(true);
  };

  const handleAddCar = () => {
    setSelectedCar(null);
    setFormData({});
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.brand || !formData.model || !formData.plate) {
      setStatus('Brand, Model and Plate are required', 'error');
      return;
    }

    setIsSaving(true);
    setStatus(t('common.processing'), 'processing', 0);

    try {
      const payload = {
        brand: formData.brand,
        model: formData.model,
        plate: formData.plate,
        color: formData.color || null,
        fuel_type: formData.fuel_type || null,
        transmission: formData.transmission || null,
        odometer: formData.odometer || 0,
        daily_rate: formData.daily_rate || 0,
        status: formData.status || 'Available',
        gps_sim: formData.gps_sim || null,
        seats: formData.seats || 5,
        notes: formData.notes || null,
        registration_expiry: formData.registration_expiry || null,
        insurance_expiry: formData.insurance_expiry || null,
        vignette_expiry: formData.vignette_expiry || null,
        first_use_date: formData.first_use_date || null,
        essentials: formData.essentials || [],
        intervals: formData.intervals || [],
      };

      let savedCar: any;

      if (modalMode === 'edit' && selectedCar?.id) {
        const { data, error } = await supabase
          .from('cars')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', selectedCar.id)
          .select()
          .single();
        if (error) throw error;
        savedCar = data;
      } else {
        const { data, error } = await supabase
          .from('cars')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        savedCar = data;
      }

      // Upload pending docs and save to car_documents
      const carId = savedCar.id;
      const newDocs: any[] = [];
      const rawDocs = formData.documents || [];

      for (const doc of rawDocs) {
        const docType = doc.doc_type;
        let fileUrl = (doc as any).file_url;

        if ((doc as any).file_data) {
          const ext = (doc as any).mime_type?.includes('pdf') ? 'pdf' : 'png';
          const url = await uploadFile('car-docs', (doc as any).file_data.replace(/^data:.*?;base64,/, ''), `${docType}_${Date.now()}.${ext}`, (doc as any).mime_type || 'image/png', carId);
          if (url) fileUrl = url;
        }

        if (fileUrl) {
          newDocs.push({ car_id: carId, doc_type: docType, file_url: fileUrl, file_name: (doc as any).file_name, mime_type: (doc as any).mime_type });
        }
      }

      if (modalMode === 'edit' && selectedCar?.id) {
        await supabase.from('car_documents').delete().eq('car_id', carId);
      }

      if (newDocs.length > 0) {
        const { data: insertedDocs } = await supabase.from('car_documents').insert(newDocs).select();
        savedCar.documents = insertedDocs || newDocs;
      } else {
        savedCar.documents = [];
      }

      handleOptimisticUpdate(savedCar);

      setStatus(t('common.actionCompleted'), 'success');
      setIsModalOpen(false);
      setSelectedCar(null);
      setFormData({});
    } catch (error: any) {
      console.error('Save error:', error);
      setStatus(`${t('common.error')}: ${error.message || ''}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCar?.id) return;
    const confirmed = await customConfirm({
      title: t('common.confirmDelete', 'Delete Car'),
      message: t('common.confirmDelete', 'Are you sure you want to delete this car?'),
      confirmLabel: t('common.delete', 'Delete'),
      cancelLabel: t('common.cancel', 'Cancel'),
      type: 'danger'
    });
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', selectedCar.id);
      if (error) throw error;

      setFleetData(prev => {
        const next = prev.filter(c => c.id !== selectedCar.id);
        localStorage.setItem('fleet_cache', JSON.stringify(next));
        return next;
      });

      setStatus(t('common.actionCompleted', 'Done'), 'success');
      setIsModalOpen(false);
      setSelectedCar(null);
      setFormData({});
    } catch (error: any) {
      setStatus(`${t('common.error')}: ${error.message || ''}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOptimisticUpdate = (car: any) => {
    const docs = car.documents || [];
    const imageDoc = docs.find((d: any) => d.doc_type === 'image');
    const formatted: FormattedCar = {
      ...car,
      id: car.id || `temp-${Date.now()}`,
      name: `${car.brand} ${car.model}`,
      rate: `${formatCurrency(car.daily_rate)} ${t('common.perDay')}`,
      statusColor: car.status === 'Available' ? 'bg-primary' : 
                   car.status === 'In Maintenance' ? 'bg-workshop-amber' : 
                   car.status === 'Rented' ? 'bg-indigo-600' : 'bg-slate-500',
      needsMaintenance: car.status === 'In Maintenance' || car.status === 'Workshop',
      image: imageDoc?.file_url ? getDriveImageUrl(imageDoc.file_url) : null
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
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCar(null);
            setFormData({});
          }}
          closeDisabled={isSaving}
          title={
            <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-[0.2em]">
              {modalMode === 'add' ? t('carForm.title', 'Add Vehicle') : t('carDetails.title', 'Edit Vehicle')}
            </h2>
          }
          actions={
            <>
              {modalMode === 'edit' && (
                <button
                  disabled={isSaving}
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-red-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {isSaving ? 'Deleting...' : 'Delete'}
                </button>
              )}
              <button
                disabled={isSaving}
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-blue-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {isSaving ? t('carForm.processing', 'Processing...') : t('carForm.confirm', 'Save')}
              </button>
            </>
          }
        >
          <CarForm car={formData} onChange={setFormData} />
        </BaseModal>
        <BaseModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setDetailsCar(null);
          }}
          title={`${detailsCar?.brand || ''} ${detailsCar?.model || ''}`}
          actions={
            <button
              onClick={() => {
                if (!detailsCar) return;
                setIsDetailsOpen(false);
                setSelectedCar(detailsCar);
                setFormData({ ...detailsCar });
                setModalMode('edit');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-blue-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          }
        >
          {detailsCar && <Cardetails car={detailsCar} />}
        </BaseModal>

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
                                  original_doc: (car.documents || []).find((d: any) => d.doc_type === 'image')?.file_url,
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
