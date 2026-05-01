import React, { useState, useRef } from 'react';
import { 
  X, Car as CarIcon, Upload, Camera, FileText, Verified, 
  Settings, Trash2, Plus, Check, ChevronDown, Loader2, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useStatus } from '../contexts/StatusContext';
import Button1 from './Button1';
import Field1 from './Field1';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function AddCarModal({ isOpen, onClose }: AddCarModalProps) {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  // Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual'>('Automatic');
  const [odometer, setOdometer] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [carStatus, setCarStatus] = useState('Available');
  const [damageNotes, setDamageNotes] = useState('');
  const [gpsSim, setGpsSim] = useState('');
  const [seats, setSeats] = useState('');
  const [startingFuelLevel, setStartingFuelLevel] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const validatePlate = (p: string) => /^[a-zA-Z0-9-\s]{2,15}$/.test(p);

  // Dynamic Lists States
  const [isAddingEssential, setIsAddingEssential] = useState(false);
  const [newEssentialText, setNewEssentialText] = useState('');
  const [essentials, setEssentials] = useState<EssentialItem[]>([
    { id: '1', name: 'Safety Vest', checked: true },
    { id: '2', name: 'Warning Triangle', checked: true },
    { id: '3', name: 'Fire Extinguisher', checked: true },
    { id: '4', name: 'Spare Tire', checked: true },
    { id: '5', name: 'Lifting Jack', checked: true },
    { id: '6', name: 'First Aid Kit', checked: true },
  ]);

  const [intervals, setIntervals] = useState<MaintenanceInterval[]>([
    { id: '1', type: 'Engine Oil', value: '', lastCompleted: '' }
  ]);

  const serviceOptions = [
    "Engine Oil", "Coolant (Antigel)", "Brake Fluid", "Gearbox Oil", "Air Filter", 
    "Fuel Filter", "Cabin/AC Filter", "Brake Pads (Plaquettes de frein)", "Tires", 
    "Wiper Blades", "Timing Belt (Courroie)", "Battery", "Spark Plugs (Bougies)", "Shock Absorbers"
  ];

  const handleAddInterval = () => {
    setIntervals([...intervals, { 
      id: Date.now().toString(), 
      type: 'Engine Oil', 
      value: '', 
      lastCompleted: '' 
    }]);
  };

  const handleRemoveInterval = (id: string) => {
    setIntervals(intervals.filter(i => i.id !== id));
  };

  const handleUpdateInterval = (id: string, field: keyof MaintenanceInterval, value: string) => {
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
    setEssentials(essentials.filter(e => e.id !== id));
  };

  const getStatusColor = () => {
    switch (carStatus) {
      case 'Available': return 'border-green-500';
      case 'In Maintenance': return 'border-amber-500';
      case 'Decommissioned': return 'border-slate-500';
      default: return 'border-form-border';
    }
  };

  const handleConfirm = async () => {
    if (!brand || !model || !plate || !dailyRate) {
      alert(t('carForm.fillRequired'));
      return;
    }

    if (!validatePlate(plate)) {
      setErrors({ plate: t('carForm.invalidPlate') });
      alert(t('common.error'));
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    setStatus(t('common.savingCar'), 'processing', 0);

    try {
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .insert([{
          brand,
          model,
          plate,
          color,
          fuel_type: fuelType,
          transmission,
          odometer: parseInt(odometer) || 0,
          daily_rate: parseFloat(dailyRate),
          status: carStatus,
          starting_fuel_level: parseInt(startingFuelLevel) || 100,
          gps_sim: gpsSim,
          seats: parseInt(seats) || 5,
          damage_notes: damageNotes,
          image_url: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800'
        }])
        .select()
        .single();

      if (carError) throw carError;

      // Insert selected essentials
      const selectedEssentials = essentials
        .filter(e => e.checked)
        .map(e => ({
          car_id: carData.id,
          name: e.name,
          is_included: true
        }));

      if (selectedEssentials.length > 0) {
        const { error: essError } = await supabase
          .from('essentials')
          .insert(selectedEssentials);
        if (essError) throw essError;
      }

      // Insert maintenance intervals
      const maintenanceData = intervals
        .filter(i => i.value || i.lastCompleted)
        .map(i => ({
          car_id: carData.id,
          interval_type: i.type,
          interval_value: i.value,
          last_completed_date: i.lastCompleted || null
        }));

      if (maintenanceData.length > 0) {
        const { error: maintError } = await supabase
          .from('maintenance_intervals')
          .insert(maintenanceData);
        if (maintError) throw maintError;
      }

      alert(t('carForm.success'));
      setStatus(t('common.dataSaved'), 'success');
      onClose();
    } catch (error: any) {
      console.error('Error inserting car:', error);
      setStatus(t('common.error'), 'error');
      alert(`${t('common.error')}: ${error.message || t('carForm.processing')}`);
    } finally {
      setIsSubmitting(false);
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">{t('carForm.title')}</h2>
            <p className="text-white/80 text-sm sm:text-base">{t('carForm.subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-white w-full">
          {/* Section 1: Specifications */}
          <div className="p-4 sm:p-10 space-y-8">
            <div className="section-header-rule">
              <div className="section-header-content">
                <CarIcon className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('carForm.specs')}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: t('carForm.brand'), val: brand, setter: setBrand },
                { label: t('carForm.model'), val: model, setter: setModel },
                { label: t('carForm.plate'), val: plate, setter: setPlate, extra: 'uppercase', error: errors.plate },
                { label: t('carForm.color'), val: color, setter: setColor },
              ].map(field => (
                <Field1 
                  key={field.label}
                  label={field.label}
                  value={field.val}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={t('carForm.placeholder')}
                  error={field.error}
                  className={field.extra}
                />
              ))}

              <Field1 
                label={t('carForm.fuelType')}
                as="select"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
              >
                <option value="Petrol">{t('carForm.fuelPetrol', 'Petrol')}</option>
                <option value="Diesel">{t('carForm.fuelDiesel', 'Diesel')}</option>
                <option value="Electric">{t('carForm.fuelElectric', 'Electric')}</option>
                <option value="Hybrid">{t('carForm.fuelHybrid', 'Hybrid')}</option>
              </Field1>

              <div className="space-y-2">
                <label className="text-[0.75rem] text-black font-bold relative top-[0.5rem] ml-[7px] px-[3px] bg-white w-fit z-10 uppercase tracking-wider">{t('carForm.transmission')}</label>
                <div className="flex border-2 border-black rounded-[5px] h-[46px] overflow-hidden">
                  <button 
                    onClick={() => setTransmission('Automatic')}
                    className={`flex-1 font-bold text-xs uppercase tracking-widest transition-colors ${transmission === 'Automatic' ? 'bg-midnight-ink text-white' : 'bg-white text-midnight-ink'}`}
                  >
                    {t('carForm.transAuto', 'Automatic')}
                  </button>
                  <button 
                    onClick={() => setTransmission('Manual')}
                    className={`flex-1 font-bold text-xs uppercase tracking-widest transition-colors border-l border-black ${transmission === 'Manual' ? 'bg-midnight-ink text-white' : 'bg-white text-midnight-ink'}`}
                  >
                    {t('carForm.transManual', 'Manual')}
                  </button>
                </div>
              </div>

              <Field1 
                label={t('carForm.odometer')}
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder={t('carForm.placeholder')}
              />

              <Field1 
                label={t('carForm.dailyRate')}
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                placeholder={t('carForm.placeholder')}
              />

              <Field1 
                label={t('carForm.startingFuel')}
                type="number"
                value={startingFuelLevel}
                onChange={(e) => setStartingFuelLevel(e.target.value)}
                placeholder="0-100"
              />

              <div className="sm:col-span-2 lg:col-span-4 space-y-2">
                <Field1 
                  label={t('carForm.status')}
                  as="select"
                  value={carStatus}
                  onChange={(e) => setCarStatus(e.target.value)}
                  className={`border-s-4 ${getStatusColor()} font-bold`}
                >
                  <option value="Available" className="text-green-600 font-bold">{t('common.available')}</option>
                  <option value="In Maintenance" className="text-amber-600 font-bold">{t('common.maintenance')}</option>
                  <option value="Decommissioned" className="text-slate-600 font-bold">{t('common.decommissioned')}</option>
                </Field1>
              </div>
            </div>
          </div>

          {/* Section 2: Media & Equipment */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <Camera className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('carForm.media')}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.uploadImage')}</label>
                <div className="w-full aspect-video border-2 border-dashed border-form-border bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-ink/5 transition-colors">
                  <Camera className="w-12 h-12 text-midnight-ink/40" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-midnight-ink/60">{t('carForm.dragOrClick')}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <Button1 
                    onClick={() => {}}
                    className="w-full !justify-between"
                    icon={<Upload className="w-5 h-5" />}
                  >
                    {t('carForm.pdfLabel')}
                  </Button1>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field1 
                    label={t('carForm.gpsSim')}
                    value={gpsSim}
                    onChange={(e) => setGpsSim(e.target.value)}
                    placeholder={t('carForm.placeholder')}
                  />
                  <Field1 
                    label={t('carForm.seats')}
                    type="number"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    placeholder={t('carForm.placeholder')}
                  />
                </div>
              </div>
              <div className="lg:col-span-2 space-y-2">
                <label className="text-[0.75rem] text-black font-bold relative top-[0.5rem] ml-[7px] px-[3px] bg-white w-fit z-10 uppercase tracking-wider">{t('carForm.damageNotes')}</label>
                <textarea 
                  className="w-full bg-white p-[11px_10px] min-h-[100px] border-2 border-black rounded-[5px] resize-none font-bold"
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
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
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('carForm.essentials')}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.includedItems')}</label>
                  <button 
                    onClick={() => setIsAddingEssential(true)}
                    className="text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> {t('carForm.addItem')}
                  </button>
                </div>
                <AnimatePresence>
                  {isAddingEssential && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-4 bg-white border-1.5 border-primary industrial-shadow overflow-hidden"
                    >
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 p-2 text-sm bg-white border-form-border"
                          value={newEssentialText}
                          onChange={(e) => setNewEssentialText(e.target.value)}
                          placeholder={t('carForm.itemName')}
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
                          onChange={(e) => setEssentials(essentials.map(ext => ext.id === item.id ? { ...ext, checked: e.target.checked } : ext))}
                          className="w-6 h-6 border-2 border-midnight-ink text-primary focus:ring-0 rounded-none" 
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
                      </label>
                      <button 
                        onClick={() => handleRemoveEssential(item.id)}
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.paperwork')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'registrationCard', label: t('carForm.registrationCard') },
                    { key: 'insuranceExpir', label: t('carForm.insuranceExpir') },
                    { key: 'techInspection', label: t('carForm.techInspection') },
                    { key: 'taxRenewal', label: t('carForm.taxRenewal') }
                  ].map(doc => (
                    <div key={doc.key} className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-midnight-ink/60">{doc.label}</p>
                      <input className="w-full bg-white p-3 text-sm industrial-shadow" type="date" />
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
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('carForm.maintenance')}</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <button 
                  onClick={handleAddInterval}
                  className="flex items-center gap-2 px-4 py-2 bg-midnight-ink text-white font-bold text-xs uppercase tracking-widest industrial-shadow hover:bg-ink transition-all"
                >
                  <Plus className="w-4 h-4" /> {t('carForm.addInterval')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="hidden md:table-header-group">
                    <tr className="bg-white text-left">
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest border border-form-border">{t('carForm.intervalType')}</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest border border-form-border">{t('carForm.intervalValue')}</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest border border-form-border">{t('carForm.lastCompleted')}</th>
                      <th className="p-3 w-[60px] border border-form-border"></th>
                    </tr>
                  </thead>
                  <tbody className="flex flex-col gap-4 md:table-row-group">
                    {intervals.map((interval) => (
                      <tr key={interval.id} className="group border border-form-border p-4 md:p-0 flex flex-col md:table-row bg-white industrial-shadow md:shadow-none">
                        <td className="md:p-2 md:border md:border-form-border before:content-[attr(data-label)] before:block before:md:hidden before:text-[10px] before:font-bold before:text-slate-500 mb-2 md:mb-0" data-label={t('carForm.intervalType').toUpperCase()}>
                          <select 
                            className="w-full p-2 text-sm bg-transparent border-none focus:ring-0"
                            value={interval.type}
                            onChange={(e) => handleUpdateInterval(interval.id, 'type', e.target.value)}
                          >
                            {serviceOptions.map(opt => <option key={opt}>{opt}</option>)}
                          </select>
                        </td>
                        <td className="md:p-2 md:border md:border-form-border before:content-[attr(data-label)] before:block before:md:hidden before:text-[10px] before:font-bold before:text-slate-500 mb-2 md:mb-0" data-label={t('carForm.intervalValue').toUpperCase()}>
                          <input 
                            className="w-full p-2 text-sm border-none focus:ring-0" 
                            placeholder={t('carForm.placeholder')} 
                            value={interval.value}
                            onChange={(e) => handleUpdateInterval(interval.id, 'value', e.target.value)}
                          />
                        </td>
                        <td className="md:p-2 md:border md:border-form-border before:content-[attr(data-label)] before:block before:md:hidden before:text-[10px] before:font-bold before:text-slate-500 mb-2 md:mb-0" data-label={t('carForm.lastCompleted').toUpperCase()}>
                          <input 
                            type="date"
                            className="w-full p-2 text-sm border-none focus:ring-0"
                            value={interval.lastCompleted}
                            onChange={(e) => handleUpdateInterval(interval.id, 'lastCompleted', e.target.value)}
                          />
                        </td>
                        <td className="md:p-2 md:border md:border-form-border text-center">
                          <button 
                            onClick={() => handleRemoveInterval(interval.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-8 sm:px-10 bg-slate-50 border-t border-black flex flex-col sm:flex-row gap-4 shrink-0">
            <Button1 
              onClick={onClose}
              className="sm:flex-1 !bg-slate-500 !border-slate-500 hover:!bg-slate-600 hover:!border-slate-600"
            >
              {t('common.cancel')}
            </Button1>
            <Button1 
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="sm:flex-[2]"
              icon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            >
              {isSubmitting ? t('carForm.processing') : t('carForm.confirm')}
            </Button1>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
