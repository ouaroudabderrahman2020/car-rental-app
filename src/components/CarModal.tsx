import React, { useState, useEffect } from 'react';
import { 
  Check, Edit, Lock, Loader2, Monitor, Trash2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { gasService } from '../lib/gas';
import { useStatus } from '../contexts/StatusContext';
import { Car, MaintenanceInterval, EssentialItem } from '../types';
import CarForm from './CarForm';
import Button1 from './Button1';
import ImageToPdf from './tools/ImageToPdf';
import BaseModal from './BaseModal';

interface CarModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  carData?: Car | null;
}

export default function CarModal({ isOpen, onClose, mode, carData }: CarModalProps) {
  const { t } = useTranslation();
  const { setStatus: setGlobalStatus } = useStatus();
  
  const [isEditMode, setIsEditMode] = useState(mode === 'add');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [fuelType, setFuelType] = useState<any>('Petrol');
  const [transmission, setTransmission] = useState<any>('Automatic');
  const [odometer, setOdometer] = useState('0');
  const [dailyRate, setDailyRate] = useState('0');
  const [status, setStatus] = useState<any>('Available');
  const [damageNotes, setDamageNotes] = useState('');
  const [gpsSim, setGpsSim] = useState('');
  const [seats, setSeats] = useState('5');
  const [startingFuelLevel, setStartingFuelLevel] = useState('100');

  const [registrationExpiry, setRegistrationExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [techInspectionExpiry, setTechInspectionExpiry] = useState('');
  const [taxRenewalExpiry, setTaxRenewalExpiry] = useState('');

  // Media & Files
  const [carImage, setCarImage] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [docFile, setDocFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [showPdfTool, setShowPdfTool] = useState(false);

  // Dynamic Lists State
  const [isAddingEssential, setIsAddingEssential] = useState(false);
  const [newEssentialText, setNewEssentialText] = useState('');
  const [essentials, setEssentials] = useState<EssentialItem[]>([]);
  const [intervals, setIntervals] = useState<MaintenanceInterval[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && carData) {
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
        setImageUrl(carData.image_url || '');
        setDocUrl(carData.documentation_url || '');
        setEssentials(carData.essentials || []);
        setIntervals(carData.intervals || []);
        setIsEditMode(false);
      } else {
        // Add mode defaults
        setBrand('');
        setModel('');
        setPlate('');
        setColor('');
        setFuelType('Petrol');
        setTransmission('Automatic');
        setOdometer('0');
        setDailyRate('0');
        setStatus('Available');
        setDamageNotes('');
        setGpsSim('');
        setSeats('5');
        setStartingFuelLevel('100');
        setRegistrationExpiry('');
        setInsuranceExpiry('');
        setTechInspectionExpiry('');
        setTaxRenewalExpiry('');
        setImageUrl('');
        setDocUrl('');
        setEssentials([
          { id: '1', name: 'Safety Vest', checked: true },
          { id: '2', name: 'Warning Triangle', checked: true },
          { id: '3', name: 'Fire Extinguisher', checked: true },
          { id: '4', name: 'Spare Tire', checked: true },
          { id: '5', name: 'Lifting Jack', checked: true },
          { id: '6', name: 'First Aid Kit', checked: true },
        ]);
        setIntervals([{ id: '1', type: 'Engine Oil', value: '', lastCompleted: '' }]);
        setIsEditMode(true);
      }
      setCarImage(null);
      setDocFile(null);
    }
  }, [carData, isOpen, mode]);

  const handlePdfToolAssign = async (pdfResults: any[]) => {
    if (pdfResults.length === 0) return;
    try {
      const result = pdfResults[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setDocFile({
          base64Data,
          fileName: result.name,
          contentType: 'application/pdf'
        });
        setShowPdfTool(false);
      };
      reader.readAsDataURL(result.blob);
    } catch (err) {
      console.error('Error assigning PDF tool result:', err);
    }
  };

  const validatePlate = (p: string) => /^[a-zA-Z0-9-\s]{2,15}$/.test(p);

  const handleConfirm = async () => {
    if (!brand || !model || !plate || !dailyRate) {
      alert(t('carForm.fillRequired'));
      return;
    }

    if (!validatePlate(plate)) {
      alert(t('carForm.invalidPlate'));
      return;
    }

    setIsSubmitting(true);
    setGlobalStatus(t('common.savingCar'), 'processing', 0);
    try {
      let finalImageUrl = imageUrl || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800';
      let finalDocUrl = docUrl;

      // Handle File Uploads via GAS if present
      if (carImage) {
        setGlobalStatus(t('common.uploadingImage'), 'processing');
        const imgRes = await gasService.uploadBase64({
          ...carImage,
          category: 'CARS',
          entityIdentifier: plate
        });
        if (imgRes.status === 'success') {
          finalImageUrl = imgRes.data.url;
        } else {
          console.warn('Image upload failed:', imgRes.message);
        }
      }

      if (docFile) {
        setGlobalStatus(t('common.uploadingDoc'), 'processing');
        const docRes = await gasService.uploadBase64({
          ...docFile,
          category: 'CARS',
          entityIdentifier: plate
        });
        if (docRes.status === 'success') {
          finalDocUrl = docRes.data.url;
        } else {
          console.warn('Doc upload failed:', docRes.message);
        }
      }

      const payload = {
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
        image_url: finalImageUrl,
        documentation_url: finalDocUrl,
        essentials,
        intervals,
      };

      if (mode === 'edit' && carData?.id) {
        const { error } = await supabase
          .from('cars')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', carData.id);
        if (error) throw error;
        alert(t('carDetails.updateSuccess'));
      } else {
        const { error } = await supabase
          .from('cars')
          .insert([payload]);
        if (error) throw error;
        alert(t('carForm.success'));
      }

      setGlobalStatus(t('common.dataSaved'), 'success');
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      setGlobalStatus(t('common.error'), 'error');
      alert(`${t('carDetails.updateError')}: ${error.message || ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCar = async () => {
    if (!carData?.id) return;
    if (confirm(t('carDetails.removeCarConfirm'))) {
      setIsSubmitting(true);
      setGlobalStatus(t('common.deleting'), 'processing', 0);
      try {
        const { error } = await supabase
          .from('cars')
          .delete()
          .eq('id', carData.id);
        if (error) throw error;
        setGlobalStatus(t('common.deleted'), 'success');
        onClose();
      } catch (error: any) {
        console.error('Delete error:', error);
        setGlobalStatus(t('common.error'), 'error');
        alert(t('common.error'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'add' ? t('carForm.title') : t('carDetails.title')}
    >
      <div className="bg-white w-full">
        {/* Header toolbar */}
        <div className="px-6 py-4 sm:px-10 bg-midnight-ink flex flex-wrap justify-between items-center shrink-0 border-b border-black">
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
              {mode === 'add' ? t('carForm.subtitle') : t('carDetails.subtitle')}
            </span>
          </div>
          {mode === 'edit' && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-6 py-2.5 text-white font-bold text-xs uppercase tracking-widest industrial-shadow transition-all ${isEditMode ? 'bg-slate-700' : 'bg-primary'}`}
            >
              {isEditMode ? <Lock className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              <span>{isEditMode ? t('carDetails.lockSave') : t('carDetails.editProfile')}</span>
            </button>
          )}
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
          carImage={carImage} setCarImage={setCarImage}
          docFile={docFile} setDocFile={setDocFile}
          onOpenPdfTool={() => setShowPdfTool(true)}
          imageUrl={imageUrl} docUrl={docUrl}
          errors={{}}
          disabled={!isEditMode || isSubmitting}
        />

        {/* Footer */}
        <div className="px-6 py-8 sm:px-10 bg-slate-50 border-t border-black flex flex-col sm:flex-row gap-4 shrink-0">
          <Button1 
            onClick={onClose}
            className="sm:flex-1 !bg-slate-500 !border-slate-500 hover:!bg-slate-600 hover:!border-slate-600"
          >
            {mode === 'edit' && !isEditMode ? t('common.close') : t('common.cancel')}
          </Button1>
          {mode === 'edit' && isEditMode && (
            <Button1 
              onClick={handleRemoveCar}
              disabled={isSubmitting}
              className="sm:flex-1 !bg-red-600 !border-red-600 hover:!bg-red-700 hover:!border-red-700"
              icon={<Trash2 className="w-5 h-5" />}
            >
              {t('carDetails.removeCar')}
            </Button1>
          )}
          {isEditMode && (
            <Button1 
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="sm:flex-[2]"
              icon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            >
              {isSubmitting ? t('carForm.processing') : (mode === 'add' ? t('carForm.confirm') : t('carDetails.lockSave'))}
            </Button1>
          )}
        </div>

        {/* PDF Tool Overlay */}
        <AnimatePresence>
          {showPdfTool && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center bg-midnight-ink/90 backdrop-blur-md p-4 sm:p-20 overflow-y-auto no-scrollbar">
              <div className="bg-white w-full max-w-4xl p-8 sm:p-12 industrial-shadow relative my-auto">
                <button 
                  onClick={() => setShowPdfTool(false)}
                  className="absolute top-4 right-4 p-2 text-ink/40 hover:text-red-500 transition-colors"
                >
                  <X size={32} />
                </button>
                
                <div className="mb-12 border-b-4 border-midnight-ink pb-4">
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-midnight-ink flex items-center gap-4">
                    <Monitor className="w-10 h-10 text-primary" />
                    {t('tools.imageToPdf')}
                  </h3>
                </div>

                <ImageToPdf onAssign={handlePdfToolAssign} />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </BaseModal>
  );
}
