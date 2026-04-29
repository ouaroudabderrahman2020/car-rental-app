import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Car as CarIcon, Upload, Camera, FileText, Verified, 
  Settings, Trash2, Plus, Check, ChevronDown, Edit, Lock, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Car } from '../types';

interface CarDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  carData: Car;
}

interface MaintenanceInterval {
  id: string;
  type: string;
  value: string;
  lastCompleted: string;
}

interface EssentialItem {
  id: string;
  name: string;
  checked: boolean;
}

export default function CarDetailsModal({ isOpen, onClose, carData }: CarDetailsModalProps) {
  const { t } = useTranslation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [brand, setBrand] = useState(carData?.brand || '');
  const [model, setModel] = useState(carData?.model || '');
  const [plate, setPlate] = useState(carData?.plate || '');
  const [color, setColor] = useState(carData?.color || '');
  const [fuelType, setFuelType] = useState<any>(carData?.fuel_type || 'Petrol');
  const [transmission, setTransmission] = useState<any>(carData?.transmission || 'Automatic');
  const [odometer, setOdometer] = useState(carData?.odometer?.toString() || '0');
  const [dailyRate, setDailyRate] = useState(carData?.daily_rate?.toString() || '0');
  const [status, setStatus] = useState<any>(carData?.status || 'Available');
  const [damageNotes, setDamageNotes] = useState(carData?.damage_notes || '');
  const [gpsSim, setGpsSim] = useState(carData?.gps_sim || '');
  const [seats, setSeats] = useState(carData?.seats?.toString() || '5');
  const [startingFuelLevel, setStartingFuelLevel] = useState(carData?.starting_fuel_level?.toString() || '100');

  // Dynamic Lists State
  const [isAddingEssential, setIsAddingEssential] = useState(false);
  const [newEssentialText, setNewEssentialText] = useState('');
  const [essentials, setEssentials] = useState<EssentialItem[]>(carData?.essentials || [
    { id: '1', name: 'Safety Vest', checked: true },
    { id: '2', name: 'Warning Triangle', checked: true },
    { id: '3', name: 'Fire Extinguisher', checked: true },
    { id: '4', name: 'Tire Repair Kit', checked: true },
    { id: '5', name: 'Mobile Connector', checked: true },
    { id: '6', name: 'Floor Mats', checked: true },
  ]);

  const [intervals, setIntervals] = useState<MaintenanceInterval[]>(carData?.intervals || [
    { id: '1', type: 'Cabin/AC Filter', value: '20,000 KM', lastCompleted: '2023-11-20' },
    { id: '2', type: 'Tires', value: 'Annual Rotation', lastCompleted: '2024-02-10' }
  ]);

  useEffect(() => {
    if (carData) {
      setBrand(carData.brand || '');
      setModel(carData.model || '');
      setPlate(carData.plate || '');
      setColor(carData.color || '');
      setFuelType(carData.fuel_type || 'Petrol');
      setTransmission(carData.transmission || 'Automatic');
      setOdometer(carData.odometer?.toString() || '0');
      setDailyRate(carData.daily_rate?.toString() || '0');
      setStatus(carData.status || 'Available');
      setDamageNotes(carData.damage_notes || '');
      setGpsSim(carData.gps_sim || '');
      setSeats(carData.seats?.toString() || '5');
      setStartingFuelLevel(carData.starting_fuel_level?.toString() || '100');
    }
  }, [carData]);

  const fetchEssentials = async () => {
    if (!carData?.id) return;
    const { data } = await supabase
      .from('essentials')
      .select('id, name, is_included')
      .eq('car_id', carData.id);
    if (data) {
      setEssentials(data.map(e => ({ id: e.id, name: e.name, checked: e.is_included })));
    }
  };

  const fetchMaintenance = async () => {
    if (!carData?.id) return;
    const { data } = await supabase
      .from('maintenance_intervals')
      .select('*')
      .eq('car_id', carData.id);
    if (data) {
      setIntervals(data.map(m => ({
        id: m.id,
        type: m.interval_type,
        value: m.interval_value || '',
        lastCompleted: m.last_completed_date || ''
      })));
    }
  };

  useEffect(() => {
    if (isOpen && carData?.id) {
      fetchEssentials();
      fetchMaintenance();
    }
  }, [isOpen, carData]);

  const serviceOptions = [
    "Engine Oil", "Coolant (Antigel)", "Brake Fluid", "Gearbox Oil", "Air Filter", 
    "Fuel Filter", "Cabin/AC Filter", "Brake Pads (Plaquettes de frein)", "Tires", 
    "Wiper Blades", "Timing Belt (Courroie)", "Battery", "Spark Plugs (Bougies)", "Shock Absorbers"
  ];

  const handleAddInterval = () => {
    if (!isEditMode) return;
    setIntervals([...intervals, { 
      id: Date.now().toString(), 
      type: 'Engine Oil', 
      value: '', 
      lastCompleted: '' 
    }]);
  };

  const handleRemoveInterval = (id: string) => {
    if (!isEditMode) return;
    setIntervals(intervals.filter(i => i.id !== id));
  };

  const handleUpdateInterval = (id: string, field: keyof MaintenanceInterval, value: string) => {
    if (!isEditMode) return;
    setIntervals(intervals.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleAddEssential = () => {
    if (newEssentialText.trim()) {
      setEssentials([...essentials, { 
        id: Date.now().toString(), 
        name: newEssentialText.trim(), 
        checked: true 
      }]);
      setNewEssentialText('');
      setIsAddingEssential(false);
    }
  };

  const handleRemoveEssential = (id: string) => {
    if (!isEditMode) return;
    setEssentials(essentials.filter(e => e.id !== id));
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Available': return 'border-green-500';
      case 'In Maintenance': return 'border-amber-500';
      case 'Decommissioned': return 'border-slate-500';
      default: return 'border-form-border';
    }
  };

  const handleConfirm = async () => {
    if (!carData?.id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('cars')
        .update({
          brand,
          model,
          plate,
          color,
          fuel_type: fuelType,
          transmission,
          odometer: parseInt(odometer) || 0,
          daily_rate: parseFloat(dailyRate),
          status,
          starting_fuel_level: parseInt(startingFuelLevel) || 100,
          gps_sim: gpsSim,
          seats: parseInt(seats) || 5,
          damage_notes: damageNotes
        })
        .eq('id', carData.id);

      if (error) throw error;

      // Update Essentials (this is a simple sync for demo purposes)
      // Delete existing and re-insert checked ones
      await supabase.from('essentials').delete().eq('car_id', carData.id);
      const selectedEssentials = essentials
        .filter(e => e.checked)
        .map(e => ({
          car_id: carData.id,
          name: e.name,
          is_included: true
        }));
      if (selectedEssentials.length > 0) {
        await supabase.from('essentials').insert(selectedEssentials);
      }

      // Update maintenance
      await supabase.from('maintenance_intervals').delete().eq('car_id', carData.id);
      const maintenanceData = intervals
        .filter(i => i.value || i.lastCompleted)
        .map(i => ({
          car_id: carData.id,
          interval_type: i.type,
          interval_value: i.value,
          last_completed_date: i.lastCompleted || null
        }));
      if (maintenanceData.length > 0) {
        await supabase.from('maintenance_intervals').insert(maintenanceData);
      }

      alert(t('carDetails.updateSuccess'));
      setIsEditMode(false);
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      alert(t('carDetails.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCar = async () => {
    if (!carData?.id) return;
    if (confirm(t('carDetails.removeCarConfirm'))) {
      try {
        const { error } = await supabase
          .from('cars')
          .delete()
          .eq('id', carData.id);
        if (error) throw error;
        onClose();
      } catch (error) {
        alert(t('common.error'));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 sm:p-10 overflow-y-auto no-scrollbar">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl industrial-shadow flex flex-col relative my-auto max-h-[95vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 bg-midnight-ink flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">{t('carDetails.title')}</h2>
            <p className="text-white/80 text-sm sm:text-base">{t('carDetails.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-4 py-2 text-white font-bold text-xs uppercase tracking-widest industrial-shadow transition-all ${isEditMode ? 'bg-midnight-ink' : 'bg-primary'}`}
            >
              {isEditMode ? <Lock className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              <span>{isEditMode ? t('carDetails.lockSave') : t('carDetails.editProfile')}</span>
            </button>
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white w-full">
          {/* Section 1: Specifications */}
          <div className="p-4 sm:p-10 space-y-8">
            <div className="section-header-rule">
              <div className="section-header-content">
                <CarIcon className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('carDetails.specs')}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: t('carForm.brand'), val: brand, setter: setBrand },
                { label: t('carForm.model'), val: model, setter: setModel },
                { label: t('carForm.plate'), val: plate, setter: setPlate, extra: 'uppercase' },
                { label: t('carForm.color'), val: color, setter: setColor },
              ].map(field => (
                <div key={field.label} className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{field.label}</label>
                  <input 
                    className={`w-full bg-white p-4 industrial-shadow disabled:bg-slate-50 disabled:cursor-default ${field.extra || ''}`}
                    value={field.val}
                    onChange={(e) => field.setter(e.target.value)}
                    disabled={!isEditMode}
                    placeholder={t('carForm.placeholder')}
                  />
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.fuelType')}</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white p-4 industrial-shadow appearance-none disabled:bg-slate-50 disabled:cursor-default"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    disabled={!isEditMode}
                  >
                    <option>{t('common.noData')}</option>
                    <option>Petrol</option>
                    <option>Diesel</option>
                    <option>Electric</option>
                    <option>Hybrid</option>
                  </select>
                  {isEditMode && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.transmission')}</label>
                <div className="flex industrial-shadow h-[60px]">
                  <button 
                    disabled={!isEditMode}
                    onClick={() => setTransmission('Automatic')}
                    className={`flex-1 font-bold text-xs uppercase tracking-widest transition-colors border-1.5 border-form-border ${transmission === 'Automatic' ? 'bg-midnight-ink text-white' : 'bg-white text-midnight-ink'} disabled:cursor-default`}
                  >
                    Automatic
                  </button>
                  <button 
                    disabled={!isEditMode}
                    onClick={() => setTransmission('Manual')}
                    className={`flex-1 font-bold text-xs uppercase tracking-widest transition-colors border-l-0 border-1.5 border-form-border ${transmission === 'Manual' ? 'bg-midnight-ink text-white' : 'bg-white text-midnight-ink'} disabled:cursor-default`}
                  >
                    Manual
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.odometer')}</label>
                <input 
                  type="number"
                  className="w-full bg-white p-4 industrial-shadow disabled:bg-slate-50"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  disabled={!isEditMode}
                  placeholder={t('carForm.placeholder')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.dailyRate')}</label>
                <input 
                  type="number"
                  className="w-full bg-white p-4 industrial-shadow disabled:bg-slate-50"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  disabled={!isEditMode}
                  placeholder={t('carForm.placeholder')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.startingFuel')}</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  className="w-full bg-white p-4 industrial-shadow disabled:bg-slate-50"
                  value={startingFuelLevel}
                  onChange={(e) => setStartingFuelLevel(e.target.value)}
                  disabled={!isEditMode}
                  placeholder="0-100"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.status')}</label>
                <div className="relative">
                  <select 
                    className={`w-full bg-white p-4 industrial-shadow border-l-4 ${getStatusColor()} appearance-none font-bold disabled:bg-slate-50`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={!isEditMode}
                  >
                    <option value="Available" className="text-green-600 font-bold">{t('common.available')}</option>
                    <option value="In Maintenance" className="text-amber-600 font-bold">{t('common.maintenance')}</option>
                    <option value="Decommissioned" className="text-slate-600 font-bold">{t('common.decommissioned')}</option>
                  </select>
                  {isEditMode && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Media & Equipment */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <Camera className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('carDetails.media')}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carDetails.imageUpload')}</label>
                <div className={`w-full aspect-video border-2 border-dashed border-form-border bg-muted-cream flex flex-col items-center justify-center transition-colors ${isEditMode ? 'cursor-pointer hover:bg-muted-mint' : 'cursor-default'}`}>
                  <Camera className="w-12 h-12 text-midnight-ink/40" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-midnight-ink/60">{t('carDetails.imageHint')}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carDetails.docUpload')}</label>
                  <button 
                    disabled={!isEditMode}
                    className={`w-full flex items-center justify-between gap-3 px-8 py-5 bg-muted-cream border-2 border-midnight-ink font-black text-xs uppercase tracking-[0.2em] industrial-shadow transition-all ${isEditMode ? 'hover:bg-muted-mint' : 'opacity-70 cursor-default'}`}
                  >
                    <span>{t('carDetails.docLabel')}</span>
                    <Upload className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.gpsSim')}</label>
                    <input 
                      className="w-full bg-white p-4 industrial-shadow disabled:bg-slate-50"
                      value={gpsSim}
                      onChange={(e) => setGpsSim(e.target.value)}
                      disabled={!isEditMode}
                      placeholder={t('carForm.placeholder')}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.seats')}</label>
                    <input 
                      type="number"
                      className="w-full bg-white p-4 industrial-shadow disabled:bg-slate-50"
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                      disabled={!isEditMode}
                      placeholder={t('carForm.placeholder')}
                    />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.damageNotes')}</label>
                <textarea 
                  className="w-full bg-white p-4 min-h-[100px] industrial-shadow resize-none disabled:bg-slate-50"
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  disabled={!isEditMode}
                  placeholder={t('carForm.placeholder')}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Essentials */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <Verified className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('carDetails.essentials')}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.includedItems')}</label>
                  {isEditMode && (
                    <button 
                      onClick={() => setIsAddingEssential(true)}
                      className="text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> {t('carDetails.addItem')}
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {isAddingEssential && isEditMode && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-4 bg-muted-mint border-1.5 border-primary industrial-shadow overflow-hidden"
                    >
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 p-2 text-sm bg-white border-form-border"
                          value={newEssentialText}
                          onChange={(e) => setNewEssentialText(e.target.value)}
                          placeholder={t('carDetails.itemName')}
                          autoFocus
                        />
                        <button 
                          onClick={handleAddEssential}
                          className="bg-primary text-white w-10 h-10 flex items-center justify-center industrial-shadow"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => { setIsAddingEssential(false); setNewEssentialText(''); }}
                          className="bg-red-600 text-white w-10 h-10 flex items-center justify-center industrial-shadow"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                  {essentials.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-4 industrial-shadow border-[1.5px] border-form-border group">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input 
                          type="checkbox"
                          checked={item.checked}
                          disabled={!isEditMode}
                          onChange={(e) => setEssentials(essentials.map(ext => ext.id === item.id ? { ...ext, checked: e.target.checked } : ext))}
                          className="w-6 h-6 border-2 border-midnight-ink text-primary focus:ring-0 rounded-none disabled:opacity-70 disabled:cursor-default" 
                        />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${!isEditMode ? 'opacity-70' : ''}`}>{item.name}</span>
                      </label>
                      {isEditMode && (
                        <button 
                          onClick={() => handleRemoveEssential(item.id)}
                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carDetails.paperwork')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    t('carForm.registrationCard'), t('carForm.insuranceExpir'), 
                    t('carForm.techInspection'), t('carForm.taxRenewal')
                  ].map(docLabel => (
                    <div key={docLabel} className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-midnight-ink/60">{docLabel}</p>
                      <input 
                        className="w-full bg-white p-3 text-sm industrial-shadow disabled:bg-slate-50" 
                        type="date" 
                        disabled={!isEditMode}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Maintenance Intervals */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <Settings className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('carDetails.maintenance')}</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                {isEditMode && (
                  <button 
                    onClick={handleAddInterval}
                    className="flex items-center gap-2 px-4 py-2 bg-midnight-ink text-white font-bold text-xs uppercase tracking-widest industrial-shadow hover:bg-ink transition-all"
                  >
                    <Plus className="w-4 h-4" /> {t('carDetails.addInterval')}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="hidden md:table-header-group">
                    <tr className="bg-muted-cream text-left">
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest border border-form-border">{t('carDetails.intervalType')}</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest border border-form-border">{t('carDetails.intervalValue')}</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest border border-form-border">{t('carDetails.lastCompleted')}</th>
                      <th className="p-3 w-[60px] border border-form-border"></th>
                    </tr>
                  </thead>
                  <tbody className="flex flex-col gap-4 md:table-row-group">
                    {intervals.map((interval) => (
                      <tr key={interval.id} className="group border border-form-border p-4 md:p-0 flex flex-col md:table-row bg-white industrial-shadow md:shadow-none">
                        <td className="md:p-2 md:border md:border-form-border before:content-[attr(data-label)] before:block before:md:hidden before:text-[10px] before:font-bold before:text-slate-500 mb-2 md:mb-0" data-label={t('carDetails.intervalType').toUpperCase()}>
                          <select 
                            className="w-full p-2 text-sm bg-transparent border-none focus:ring-0 disabled:bg-slate-50"
                            value={interval.type}
                            onChange={(e) => handleUpdateInterval(interval.id, 'type', e.target.value)}
                            disabled={!isEditMode}
                          >
                            {serviceOptions.map(opt => <option key={opt}>{opt}</option>)}
                          </select>
                        </td>
                        <td className="md:p-2 md:border md:border-form-border before:content-[attr(data-label)] before:block before:md:hidden before:text-[10px] before:font-bold before:text-slate-500 mb-2 md:mb-0" data-label={t('carDetails.intervalValue').toUpperCase()}>
                          <input 
                            className="w-full p-2 text-sm border-none focus:ring-0 disabled:bg-slate-50" 
                            placeholder={t('carForm.placeholder')} 
                            value={interval.value}
                            onChange={(e) => handleUpdateInterval(interval.id, 'value', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </td>
                        <td className="md:p-2 md:border md:border-form-border before:content-[attr(data-label)] before:block before:md:hidden before:text-[10px] before:font-bold before:text-slate-500 mb-2 md:mb-0" data-label={t('carDetails.lastCompleted').toUpperCase()}>
                          <input 
                            type="date"
                            className="w-full p-2 text-sm border-none focus:ring-0 disabled:bg-slate-50"
                            value={interval.lastCompleted}
                            onChange={(e) => handleUpdateInterval(interval.id, 'lastCompleted', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </td>
                        <td className="md:p-2 md:border md:border-form-border text-center">
                          {isEditMode && (
                            <button 
                              onClick={() => handleRemoveInterval(interval.id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-8 sm:px-10 bg-midnight-ink flex flex-col sm:flex-row gap-4 shrink-0">
            <button 
              onClick={onClose}
              className="w-full sm:flex-1 px-8 py-5 text-white font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors border border-white/20 min-h-[60px]"
            >
              {t('common.cancel')}
            </button>
            <button 
              onClick={handleRemoveCar}
              className="w-full sm:flex-1 px-8 py-5 bg-red-600 text-white font-black uppercase tracking-[0.2em] industrial-shadow hover:bg-red-700 active:scale-[0.98] transition-all min-h-[60px]"
            >
              {t('carDetails.removeCar')}
            </button>
            <button 
              disabled={isSubmitting}
              onClick={handleConfirm}
              className={`w-full sm:flex-[2] px-8 py-5 bg-primary text-white font-black uppercase tracking-[0.2em] industrial-shadow active:scale-[0.98] transition-all min-h-[60px] flex items-center justify-center gap-2 ${!isEditMode || isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? t('carForm.processing') : t('carDetails.lockSave')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
