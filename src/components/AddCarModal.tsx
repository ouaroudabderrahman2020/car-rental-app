import React, { useState } from 'react';
import { 
  X, Check, Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useStatus } from '../contexts/StatusContext';
import Button1 from './Button1';
import CarForm, { MaintenanceInterval, EssentialItem } from './CarForm';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
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
          image_url: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800',
          essentials: essentials,
          intervals: intervals
        }])
        .select()
        .single();

      if (carError) throw carError;

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
        <CarForm 
          brand={brand} setBrand={setBrand}
          model={model} setModel={setModel}
          plate={plate} setPlate={setPlate}
          color={color} setColor={setColor}
          fuelType={fuelType} setFuelType={setFuelType}
          transmission={transmission} setTransmission={setTransmission}
          odometer={odometer} setOdometer={setOdometer}
          dailyRate={dailyRate} setDailyRate={setDailyRate}
          status={carStatus} setStatus={setCarStatus}
          startingFuelLevel={startingFuelLevel} setStartingFuelLevel={setStartingFuelLevel}
          gpsSim={gpsSim} setGpsSim={setGpsSim}
          seats={seats} setSeats={setSeats}
          damageNotes={damageNotes} setDamageNotes={setDamageNotes}
          essentials={essentials} setEssentials={setEssentials}
          isAddingEssential={isAddingEssential} setIsAddingEssential={setIsAddingEssential}
          newEssentialText={newEssentialText} setNewEssentialText={setNewEssentialText}
          intervals={intervals} setIntervals={setIntervals}
          errors={errors}
          disabled={isSubmitting}
        />

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
      </motion.div>
    </div>
  );
}
