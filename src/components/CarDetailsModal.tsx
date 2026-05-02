import React, { useState, useEffect } from 'react';
import { 
  X, Check, Edit, Lock, Loader2, Monitor, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { callGasAction } from '../lib/gas';
import { useStatus } from '../contexts/StatusContext';
import { Car } from '../types';
import CarForm, { MaintenanceInterval, EssentialItem } from './CarForm';
import Button1 from './Button1';
import ImageToPdf from './tools/ImageToPdf';

interface CarDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  carData: Car;
}

export default function CarDetailsModal({ isOpen, onClose, carData }: CarDetailsModalProps) {
  const { t } = useTranslation();
  const { setStatus: setGlobalStatus } = useStatus();
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

  // Media & Files
  const [carImage, setCarImage] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [docFile, setDocFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [imageUrl, setImageUrl] = useState(carData?.image_url || '');
  const [docUrl, setDocUrl] = useState(carData?.documentation_url || '');
  const [showPdfTool, setShowPdfTool] = useState(false);

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
      setImageUrl(carData.image_url || '');
      setDocUrl(carData.documentation_url || '');
      setCarImage(null);
      setDocFile(null);
      setEssentials(carData.essentials || []);
      setIntervals(carData.intervals || []);
    }
  }, [carData, isOpen]);

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
    if (!carData?.id) return;
    setIsSubmitting(true);
    setGlobalStatus(t('common.savingCar'), 'processing', 0);
    try {
      let finalImageUrl = imageUrl;
      let finalDocUrl = docUrl;

      // Handle File Uploads via GAS if present
      if (carImage) {
        setGlobalStatus(t('common.uploadingImage'), 'processing');
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
        setGlobalStatus(t('common.uploadingDoc'), 'processing');
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
          image_url: finalImageUrl,
          documentation_url: finalDocUrl,
          essentials,
          intervals,
          updated_at: new Date().toISOString()
        })
        .eq('id', carData.id);

      if (error) throw error;

      setGlobalStatus(t('common.dataSaved'), 'success');
      alert(t('carDetails.updateSuccess'));
      setIsEditMode(false);
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
              {isEditMode ? t('common.cancel') : t('common.close')}
            </Button1>
            {isEditMode && (
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
                {isSubmitting ? t('carForm.processing') : t('carDetails.lockSave')}
              </Button1>
            )}
          </div>
      </motion.div>

      {/* Image to PDF Tool Overlay */}
      <AnimatePresence>
        {showPdfTool && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] flex items-center justify-center bg-midnight-ink/90 backdrop-blur-md p-4 sm:p-20 overflow-y-auto no-scrollbar"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
