import React, { useState } from 'react';
import { 
  Check, Loader2, Monitor, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { callGasAction } from '../lib/gas';
import { useStatus } from '../contexts/StatusContext';
import Button1 from './Button1';
import CarForm, { MaintenanceInterval, EssentialItem } from './CarForm';
import ImageToPdf from './tools/ImageToPdf';
import BaseModal from './BaseModal';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCarModal({ isOpen, onClose }: AddCarModalProps) {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  // ... rest of the state ...
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
  const [registrationExpiry, setRegistrationExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [techInspectionExpiry, setTechInspectionExpiry] = useState('');
  const [taxRenewalExpiry, setTaxRenewalExpiry] = useState('');

  // Media & Files
  const [carImage, setCarImage] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [docFile, setDocFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [showPdfTool, setShowPdfTool] = useState(false);

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
      let finalImageUrl = 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800';
      let finalDocUrl = null;

      // Handle File Uploads via GAS if present
      if (carImage) {
        setStatus(t('common.uploadingImage', 'Uploading car image...'), 'processing');
        const imgRes = await callGasAction('upload_to_drive', {
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
        setStatus(t('common.uploadingDoc', 'Uploading car documentation...'), 'processing');
        const docRes = await callGasAction('upload_to_drive', {
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
          registration_expiry: registrationExpiry || null,
          insurance_expiry: insuranceExpiry || null,
          tech_inspection_expiry: techInspectionExpiry || null,
          tax_renewal_expiry: taxRenewalExpiry || null,
          image_url: finalImageUrl,
          documentation_url: finalDocUrl,
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

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('carForm.title')}
    >
      <div className="bg-white w-full">
        {/* Subtitle / Header info moved inside content if needed, but BaseModal has title */}
        <div className="px-6 py-4 sm:px-10 bg-slate-50 border-b border-black">
           <p className="text-ink/60 text-sm sm:text-base font-bold uppercase tracking-widest">{t('carForm.subtitle')}</p>
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

        {/* Image to PDF Tool Overlay moved inside or handled via context, but for now keeping it here as a portal/overlay */}
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
