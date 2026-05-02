import React, { useState, useEffect } from 'react';
import { 
  X, Check, Edit, Lock, Loader2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Car } from '../types';
import CarForm, { MaintenanceInterval, EssentialItem } from './CarForm';

interface CarDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  carData: Car;
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

  const [registrationExpiry, setRegistrationExpiry] = useState(carData?.registration_expiry || '');
  const [insuranceExpiry, setInsuranceExpiry] = useState(carData?.insurance_expiry || '');
  const [techInspectionExpiry, setTechInspectionExpiry] = useState(carData?.tech_inspection_expiry || '');
  const [taxRenewalExpiry, setTaxRenewalExpiry] = useState(carData?.tax_renewal_expiry || '');

  // Dynamic Lists State
  const [isAddingEssential, setIsAddingEssential] = useState(false);
  const [newEssentialText, setNewEssentialText] = useState('');
  const [essentials, setEssentials] = useState<EssentialItem[]>([]);
  const [intervals, setIntervals] = useState<MaintenanceInterval[]>([]);

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
      setRegistrationExpiry(carData.registration_expiry || '');
      setInsuranceExpiry(carData.insurance_expiry || '');
      setTechInspectionExpiry(carData.tech_inspection_expiry || '');
      setTaxRenewalExpiry(carData.tax_renewal_expiry || '');
      setEssentials(carData.essentials || [
        { id: '1', name: 'Safety Vest', checked: true },
        { id: '2', name: 'Warning Triangle', checked: true },
        { id: '3', name: 'Fire Extinguisher', checked: true },
        { id: '4', name: 'Spare Tire', checked: true },
        { id: '5', name: 'Lifting Jack', checked: true },
        { id: '6', name: 'First Aid Kit', checked: true },
      ]);
      setIntervals(carData.intervals || [
        { id: '1', type: 'Engine Oil', value: '', lastCompleted: '' }
      ]);
    }
  }, [carData, isOpen]);

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
          damage_notes: damageNotes,
          registration_expiry: registrationExpiry || null,
          insurance_expiry: insuranceExpiry || null,
          tech_inspection_expiry: techInspectionExpiry || null,
          tax_renewal_expiry: taxRenewalExpiry || null,
          essentials,
          intervals,
          updated_at: new Date().toISOString()
        })
        .eq('id', carData.id);

      if (error) throw error;

      alert(t('carDetails.updateSuccess'));
      setIsEditMode(false);
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      alert(`${t('carDetails.updateError')}: ${error.message || ''}`);
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
        <CarForm 
          brand={brand} setBrand={setBrand}
          model={model} setModel={setModel}
          plate={plate} setPlate={setPlate}
          color={color} setColor={setColor}
          fuelType={fuelType} setFuelType={setFuelType}
          transmission={transmission} setTransmission={setTransmission}
          odometer={odometer} setOdometer={setOdometer}
          dailyRate={dailyRate} setDailyRate={setDailyRate}
          status={status} setStatus={setStatus}
          startingFuelLevel={startingFuelLevel} setStartingFuelLevel={setStartingFuelLevel}
          gpsSim={gpsSim} setGpsSim={setGpsSim}
          seats={seats} setSeats={setSeats}
          damageNotes={damageNotes} setDamageNotes={setDamageNotes}
          registrationExpiry={registrationExpiry} setRegistrationExpiry={setRegistrationExpiry}
          insuranceExpiry={insuranceExpiry} setInsuranceExpiry={setInsuranceExpiry}
          techInspectionExpiry={techInspectionExpiry} setTechInspectionExpiry={setTechInspectionExpiry}
          taxRenewalExpiry={taxRenewalExpiry} setTaxRenewalExpiry={setTaxRenewalExpiry}
          essentials={essentials} setEssentials={setEssentials}
          isAddingEssential={isAddingEssential} setIsAddingEssential={setIsAddingEssential}
          newEssentialText={newEssentialText} setNewEssentialText={setNewEssentialText}
          intervals={intervals} setIntervals={setIntervals}
          errors={{}}
          disabled={!isEditMode || isSubmitting}
        />

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
      </motion.div>
    </div>
  );
}
