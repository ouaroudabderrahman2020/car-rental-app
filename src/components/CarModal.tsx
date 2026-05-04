import React, { useState, useEffect } from 'react';
import { 
  Check, Edit, Lock, Loader2, Monitor, Trash2, X,
  Car as CarIcon, Upload, Camera, FileText, Verified, 
  Settings, Plus, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { gasService } from '../lib/gas';
import { useStatus } from '../contexts/StatusContext';
import { useNotification } from '../contexts/NotificationContext';
import { Car, MaintenanceInterval, EssentialItem } from '../types';
import Button1 from './Button1';
import Field1 from './Field1';
import FormSection from './FormSection';
import ImageToPdf from './tools/ImageToPdf';
import BaseModal from './BaseModal';
import { FUEL_TYPES, CAR_STATUSES, TRANSMISSIONS } from '../constants';

interface CarModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  carData?: Car | null;
  onOptimisticUpdate?: (car: any) => void;
  onOptimisticDelete?: (id: string) => void;
}

export default function CarModal({ isOpen, onClose, mode, carData, onOptimisticUpdate, onOptimisticDelete }: CarModalProps) {
  const { t } = useTranslation();
  const { setStatus: setGlobalStatus } = useStatus();
  const { showToast, confirm: customConfirm } = useNotification();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [fuelType, setFuelType] = useState<any>('Petrol');
  const [transmission, setTransmission] = useState<any>('Automatic');
  const [odometer, setOdometer] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [status, setStatus] = useState<any>('Available');
  const [notes, setNotes] = useState('');
  const [gpsSim, setGpsSim] = useState('');
  const [showRequiredError, setShowRequiredError] = useState(false);
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
      setIsSubmitting(false);
      setShowRequiredError(false);
      
      if (mode === 'edit' && carData) {
        setBrand(carData.brand || '');
        setModel(carData.model || '');
        setPlate(carData.plate || '');
        setColor(carData.color || '');
        setFuelType(carData.fuel_type || 'Petrol');
        setTransmission(carData.transmission || 'Automatic');
        setOdometer(carData.odometer ? carData.odometer.toString() : '');
        setDailyRate(carData.daily_rate ? carData.daily_rate.toString() : '');
        setStatus(carData.status || 'Available');
        setNotes(carData.damage_notes || '');
        setGpsSim(carData.gps_sim || '');
        setSeats(carData.seats ? carData.seats.toString() : '');
        setStartingFuelLevel(carData.starting_fuel_level ? carData.starting_fuel_level.toString() : '');
        setRegistrationExpiry(carData.registration_expiry || '');
        setInsuranceExpiry(carData.insurance_expiry || '');
        setTechInspectionExpiry(carData.tech_inspection_expiry || '');
        setTaxRenewalExpiry(carData.tax_renewal_expiry || '');
        setImageUrl(carData.image_url || '');
        setDocUrl(carData.documentation_url || '');
        setEssentials(carData.essentials || []);
        setIntervals((carData.intervals || []).map(interval => ({
          ...interval,
          value: (interval.value === '0' || !interval.value) ? '' : interval.value
        })));
        setIsEditMode(false);
      } else {
        // Add mode defaults
        setBrand('');
        setModel('');
        setPlate('');
        setColor('');
        setFuelType('Petrol');
        setTransmission('Automatic');
        setOdometer('');
        setDailyRate('');
        setStatus('Available');
        setNotes('');
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

  const serviceOptions = [
    "Engine Oil", "Coolant (Antigel)", "Brake Fluid", "Gearbox Oil", "Air Filter", 
    "Fuel Filter", "Cabin/AC Filter", "Brake Pads (Plaquettes de frein)", "Tires", 
    "Wiper Blades", "Timing Belt (Courroie)", "Battery", "Spark Plugs (Bougies)", "Shock Absorbers"
  ];

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

  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const fileData = {
        base64Data,
        fileName: file.name,
        contentType: file.type
      };
      if (type === 'image') setCarImage(fileData);
      else setDocFile(fileData);
    };
    reader.readAsDataURL(file);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Available': return 'border-green-500';
      case 'Unavailable': return 'border-red-500';
      case 'In Maintenance': return 'border-amber-500';
      case 'Decommissioned': return 'border-slate-500';
      default: return 'border-form-border';
    }
  };

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
    if (!isEditMode) return;
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

  const validatePlate = (p: string) => /^[a-zA-Z0-9-\s]{2,15}$/.test(p);

  const handleConfirm = async () => {
    if (!brand || !model || !plate) {
      setShowRequiredError(true);
      setTimeout(() => setShowRequiredError(false), 3000);
      return;
    }

    if (!validatePlate(plate)) {
      setGlobalStatus(t('carForm.invalidPlate'), 'error');
      return;
    }

    setIsSubmitting(true);
    setGlobalStatus("SAVING CAR DATA...", 'processing', 0);

    // Optimistic Update & Early Close
    const optimisticPayload = {
      id: carData?.id || `temp-${Date.now()}`,
      brand,
      model,
      plate,
      color,
      fuel_type: fuelType,
      transmission,
      odometer: odometer === '' ? 0 : (parseInt(odometer) || 0),
      daily_rate: dailyRate === '' ? 0 : (parseFloat(dailyRate) || 0),
      status,
      starting_fuel_level: (startingFuelLevel === '' || isNaN(parseInt(startingFuelLevel))) ? 100 : parseInt(startingFuelLevel),
      gps_sim: gpsSim,
      seats: (seats === '' || isNaN(parseInt(seats))) ? 5 : parseInt(seats),
      damage_notes: notes,
      registration_expiry: registrationExpiry || null,
      insurance_expiry: insuranceExpiry || null,
      tech_inspection_expiry: techInspectionExpiry || null,
      tax_renewal_expiry: taxRenewalExpiry || null,
      image_url: carImage ? `data:${carImage.contentType};base64,${carImage.base64Data}` : imageUrl,
      documentation_url: docUrl,
      essentials,
      intervals,
    };

    if (onOptimisticUpdate) {
      // We'll call onOptimisticUpdate AFTER success to ensure backend integrity 
      // and avoid duplicate entries with temp IDs.
    }
    // onClose(); // Removed from here, will close after success

    try {
      let finalImageUrl = imageUrl || '';
      let finalDocUrl = docUrl;

      // Helper to extract file ID from existing Drive URL if present
      const getFileIdFromUrl = (url?: string) => url?.split('id=')[1];

      // Handle File Uploads via GAS if present
      if (carImage) {
        setGlobalStatus("UPLOADING IMAGE...", 'processing');
        const oldImageId = getFileIdFromUrl(carData?.image_url);
        
        let imgRes;
        if (mode === 'edit' && oldImageId) {
          imgRes = await gasService.updateCarFile({
            oldFileId: oldImageId,
            base64: carImage.base64Data,
            fileName: carImage.fileName,
            contentType: carImage.contentType,
            plateNumber: plate
          });
        } else {
          imgRes = await gasService.uploadCarFile({
            base64: carImage.base64Data,
            fileName: carImage.fileName,
            contentType: carImage.contentType,
            plateNumber: plate
          });
        }

        if (imgRes.status === 'success') {
          finalImageUrl = imgRes.data.url;
        } else {
          console.warn('Image upload failed:', imgRes.message);
        }
      }

      if (docFile) {
        setGlobalStatus("UPLOADING DOCUMENTATION...", 'processing');
        const oldDocId = getFileIdFromUrl(carData?.documentation_url);

        let docRes;
        if (mode === 'edit' && oldDocId) {
          docRes = await gasService.updateCarFile({
            oldFileId: oldDocId,
            base64: docFile.base64Data,
            fileName: docFile.fileName,
            contentType: docFile.contentType,
            plateNumber: plate
          });
        } else {
          docRes = await gasService.uploadCarFile({
            base64: docFile.base64Data,
            fileName: docFile.fileName,
            contentType: docFile.contentType,
            plateNumber: plate
          });
        }

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
        odometer: odometer === '' ? 0 : (parseInt(odometer) || 0),
        daily_rate: dailyRate === '' ? 0 : (parseFloat(dailyRate) || 0),
        status,
        starting_fuel_level: (startingFuelLevel === '' || isNaN(parseInt(startingFuelLevel))) ? 100 : parseInt(startingFuelLevel),
        gps_sim: gpsSim,
        seats: (seats === '' || isNaN(parseInt(seats))) ? 5 : parseInt(seats),
        damage_notes: notes,
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
        const { data, error } = await supabase
          .from('cars')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', carData.id)
          .select()
          .single();
        if (error) throw error;
        
        if (onOptimisticUpdate && data) {
          onOptimisticUpdate(data);
        }
        
        setGlobalStatus("CAR SAVED SUCCESSFULLY", 'success');
        showToast(t('common.success', 'Car saved successfully'), 'success');
        onClose();
      } else {
        const { data, error } = await supabase
          .from('cars')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        
        if (onOptimisticUpdate && data) {
          onOptimisticUpdate(data);
        }
        
        setGlobalStatus("CAR SAVED SUCCESSFULLY", 'success');
        showToast(t('common.success', 'Car saved successfully'), 'success');
        onClose();
      }
    } catch (error: any) {
      console.error('Update error:', error);
      setGlobalStatus(`ERROR: ${error.message || 'FAILED TO SAVE'}`, 'error');
      showToast(error.message || 'Failed to save', 'error');
    }
  };

  const handleRemoveCar = async () => {
    if (!carData?.id) return;
    const confirmed = await customConfirm({
      title: t('carDetails.removeCar'),
      message: t('carDetails.removeCarConfirm'),
      confirmLabel: t('common.remove', 'Remove'),
      cancelLabel: t('common.cancel', 'Cancel'),
      type: 'danger'
    });

    if (confirmed) {
      setIsSubmitting(true);
      setGlobalStatus("DELETING CAR...", 'processing', 0);
      
      // Final Delete
      try {
        const { error } = await supabase
          .from('cars')
          .delete()
          .eq('id', carData.id);
        if (error) throw error;
        
        if (onOptimisticDelete && carData.id) {
          onOptimisticDelete(carData.id);
        }
        
        setGlobalStatus("CAR DELETED", 'success');
        showToast(t('common.deleted', 'Car deleted successfully'), 'success');
        onClose();
      } catch (error: any) {
        console.error('Delete error:', error);
        setGlobalStatus("ERROR: DELETE FAILED", 'error');
        showToast('Delete failed', 'error');
      }
    }
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div className="flex justify-between items-center w-full pr-8">
          <div className="flex flex-col">
            <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-[0.2em] drop-shadow-sm">
              {mode === 'add' ? t('carForm.title') : t('carDetails.title')}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {mode === 'edit' && (
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-4 py-2 text-white font-bold text-[10px] uppercase tracking-widest industrial-shadow transition-all ${isEditMode ? 'bg-slate-700' : 'bg-primary'}`}
              >
                {isEditMode ? <Lock className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isEditMode ? t('carDetails.lockSave') : t('carDetails.editProfile')}</span>
              </button>
            )}
          </div>
        </div>
      }
      headerBg="bg-warm-accent"
    >
      <div className="bg-white w-full">
        {/* Content */}
        <div className="p-4 sm:p-10">
          <FormSection title={t('carForm.specs')}>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: t('carForm.brand'), val: brand, setter: setBrand, required: true },
              { label: t('carForm.model'), val: model, setter: setModel, required: true },
              { label: t('carForm.plate'), val: plate, setter: setPlate, extra: 'uppercase', required: true },
              { label: t('carForm.color'), val: color, setter: setColor },
            ].map(field => (
              <Field1 
                key={field.label}
                label={field.label}
                value={field.val}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={t('carForm.placeholder')}
                className={field.extra}
                disabled={!isEditMode || isSubmitting}
                required={field.required}
              />
            ))}

            <Field1 
              label={t('carForm.fuelType')}
              as="select"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              disabled={!isEditMode || isSubmitting}
            >
              {FUEL_TYPES.map(ft => (
                <option key={ft} value={ft}>{t(`carForm.fuel${ft}`, ft)}</option>
              ))}
            </Field1>

            <div className="space-y-2">
              <label className="text-[0.75rem] text-black font-bold relative top-[0.5rem] ml-[7px] px-[3px] bg-white w-fit z-10 uppercase tracking-wider">{t('carForm.transmission')}</label>
              <div className="flex border-2 border-black rounded-[5px] h-[46px] overflow-hidden">
                {TRANSMISSIONS.map((trans, index) => (
                  <button 
                    key={trans}
                    type="button"
                    disabled={!isEditMode || isSubmitting}
                    onClick={() => setTransmission(trans)}
                    className={`flex-1 font-bold text-xs uppercase tracking-widest transition-colors ${index !== 0 ? 'border-l border-black' : ''} ${transmission === trans ? 'bg-midnight-ink text-white' : 'bg-white text-midnight-ink'} disabled:opacity-50`}
                  >
                    {t(`carForm.trans${trans}`, trans)}
                  </button>
                ))}
              </div>
            </div>

            <Field1 
              label={t('carForm.odometer')}
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder={t('carForm.placeholder')}
              disabled={!isEditMode || isSubmitting}
            />

            <Field1 
              label={t('carForm.dailyRate')}
              type="number"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              placeholder={t('carForm.placeholder')}
              disabled={!isEditMode || isSubmitting}
            />

            <Field1 
              label={t('carForm.startingFuel')}
              type="number"
              value={startingFuelLevel}
              onChange={(e) => setStartingFuelLevel(e.target.value)}
              placeholder="0-100"
              disabled={!isEditMode || isSubmitting}
            />

            <div className="sm:col-span-2 lg:col-span-4 space-y-2">
              <Field1 
                label={t('carForm.status')}
                as="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`border-s-4 ${getStatusColor()} font-bold`}
                disabled={!isEditMode || isSubmitting}
              >
                <option value="Available" className="text-green-600 font-bold">{t('common.available', 'Available')}</option>
                <option value="Unavailable" className="text-red-600 font-bold">{t('common.unavailable', 'Unavailable')}</option>
              </Field1>
            </div>
          </div>
          </FormSection>
        </div>

        {/* Section 2: Media & Equipment */}
        <div className="p-4 sm:p-10 border-t border-muted-cream">
          <FormSection title={t('carForm.media')}>
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.uploadImage')}</label>
                <input 
                  type="file" 
                  ref={imageInputRef}
                  onChange={(e) => handleFileChange(e, 'image')}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  onClick={() => isEditMode && !isSubmitting && imageInputRef.current?.click()}
                  className={`w-full aspect-video border-2 border-dashed border-form-border bg-slate-50 flex flex-col items-center justify-center transition-all overflow-hidden relative group ${isEditMode && !isSubmitting ? 'cursor-pointer hover:border-primary hover:bg-white' : 'cursor-default opacity-60'}`}
                >
                  {carImage || imageUrl ? (
                    <>
                      <img 
                        src={carImage ? `data:${carImage.contentType};base64,${carImage.base64Data}` : (imageUrl || undefined)} 
                        alt="Car Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isEditMode && !isSubmitting && (
                        <div className="absolute inset-0 bg-midnight-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-midnight-ink/20" />
                      <p className="mt-2 text-xs font-bold uppercase tracking-widest text-midnight-ink/40">{t('carForm.dragOrClick')}</p>
                    </>
                  )}
                </div>
                {(carImage || imageUrl) && isEditMode && !isSubmitting && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCarImage(null); }}
                    className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" /> {t('common.remove', 'Remove Image')}
                  </button>
                )}
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.pdfLabel')}</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        ref={docInputRef}
                        onChange={(e) => handleFileChange(e, 'doc')}
                        accept="application/pdf"
                        className="hidden"
                      />
                      <Button1 
                        onClick={() => isEditMode && !isSubmitting && docInputRef.current?.click()}
                        className="flex-1 !justify-between"
                        icon={<Upload className="w-5 h-5" />}
                        disabled={!isEditMode || isSubmitting}
                        type="button"
                      >
                        {t('carForm.uploadPdf', 'Upload PDF')}
                      </Button1>
                      <Button1 
                        onClick={() => setShowPdfTool(true)}
                        className="bg-slate-100 text-slate-800"
                        icon={<FileText className="w-5 h-5" />}
                        disabled={!isEditMode || isSubmitting}
                        type="button"
                        title={t('tools.imageToPdf')}
                      />
                    </div>
                    {(docFile || docUrl) && (
                      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 industrial-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center text-white">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-emerald-800 truncate max-w-[200px]">
                              {docFile ? docFile.fileName : t('carForm.viewPdf', 'Car Documentation PDF')}
                            </span>
                            <span className="text-[8px] font-bold text-emerald-600 uppercase">READY FOR UPLOAD</span>
                          </div>
                        </div>
                        {isEditMode && !isSubmitting && (
                          <button 
                            onClick={() => setDocFile(null)}
                            className="p-1 hover:bg-emerald-100 text-emerald-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field1 
                  label={t('carForm.gpsSim')}
                  value={gpsSim}
                  onChange={(e) => setGpsSim(e.target.value)}
                  placeholder={t('carForm.placeholder')}
                  disabled={!isEditMode || isSubmitting}
                />
                <Field1 
                  label={t('carForm.seats')}
                  type="number"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  placeholder={t('carForm.placeholder')}
                  disabled={!isEditMode || isSubmitting}
                />
              </div>
            </div>
            <div className="lg:col-span-2">
              <Field1 
                as="textarea"
                label={t('common.notes', 'Notes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('carForm.placeholder')}
                disabled={!isEditMode || isSubmitting}
              />
            </div>
          </div>
          </FormSection>
        </div>

        {/* Section 3: Essentials */}
        <div className="p-4 sm:p-10 border-t border-muted-cream">
          <FormSection title={t('carForm.essentials')}>
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.includedItems')}</label>
                {isEditMode && !isSubmitting && (
                  <button 
                    onClick={() => setIsAddingEssential(true)}
                    className="text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> {t('carForm.addItem')}
                  </button>
                )}
              </div>
              <AnimatePresence>
                {isAddingEssential && isEditMode && !isSubmitting && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 bg-white border-1.5 border-primary industrial-shadow overflow-hidden"
                  >
                    <div className="flex gap-2 items-end">
                      <Field1
                        className="flex-1"
                        label={t('carForm.itemName')}
                        value={newEssentialText}
                        onChange={(e) => setNewEssentialText(e.target.value)}
                        placeholder={t('carForm.itemName')}
                      />
                      <button 
                        type="button"
                        onClick={handleAddEssential}
                        className="bg-primary text-white w-10 h-10 flex items-center justify-center industrial-shadow shrink-0"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setIsAddingEssential(false); setNewEssentialText(''); }}
                        className="bg-red-600 text-white w-10 h-10 flex items-center justify-center industrial-shadow shrink-0"
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
                        disabled={!isEditMode || isSubmitting}
                        onChange={(e) => setEssentials(essentials.map(ext => ext.id === item.id ? { ...ext, checked: e.target.checked } : ext))}
                        className="w-6 h-6 border-2 border-midnight-ink text-primary focus:ring-0 rounded-none disabled:opacity-50" 
                      />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${!isEditMode || isSubmitting ? 'opacity-70' : ''}`}>{item.name}</span>
                    </label>
                    {isEditMode && !isSubmitting && (
                      <button 
                        onClick={() => handleRemoveEssential(item.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all industrial-shadow shrink-0 ml-4"
                        title={t('common.remove')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.paperwork')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'registrationExpiry', label: t('carForm.registrationCard'), val: registrationExpiry, setter: setRegistrationExpiry },
                  { key: 'insuranceExpiry', label: t('carForm.insuranceExpir'), val: insuranceExpiry, setter: setInsuranceExpiry },
                  { key: 'techInspectionExpiry', label: t('carForm.techInspection'), val: techInspectionExpiry, setter: setTechInspectionExpiry },
                  { key: 'taxRenewalExpiry', label: t('carForm.taxRenewal'), val: taxRenewalExpiry, setter: setTaxRenewalExpiry }
                ].map(doc => (
                  <Field1
                      key={doc.key}
                      label={doc.label}
                      type="date"
                      value={doc.val}
                      onChange={(e) => doc.setter(e.target.value)}
                      disabled={!isEditMode || isSubmitting}
                  />
                ))}
              </div>
            </div>
          </div>
          </FormSection>
        </div>

        {/* Section 4: Maintenance Intervals */}
        <div className="p-4 sm:p-10 border-t border-muted-cream">
          <FormSection title={t('carForm.maintenance')}>
            <div className="w-full space-y-4">
            {isEditMode && !isSubmitting && (
              <div className="flex justify-between items-center">
                <button 
                  onClick={handleAddInterval}
                  className="flex items-center gap-2 px-4 py-2 bg-midnight-ink text-white font-bold text-xs uppercase tracking-widest industrial-shadow hover:bg-ink transition-all"
                >
                  <Plus className="w-4 h-4" /> {t('carForm.addInterval')}
                </button>
              </div>
            )}
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
                      <td className="md:p-2 md:border md:border-form-border mb-2 md:mb-0">
                        <Field1
                          as="select"
                          label={t('carForm.intervalType')}
                          value={interval.type}
                          onChange={(e) => handleUpdateInterval(interval.id, 'type', e.target.value)}
                          disabled={!isEditMode || isSubmitting}
                        >
                          {serviceOptions.map(opt => <option key={opt}>{opt}</option>)}
                        </Field1>
                      </td>
                      <td className="md:p-2 md:border md:border-form-border mb-2 md:mb-0">
                        <Field1
                          label={t('carForm.intervalValue')}
                          placeholder={t('carForm.placeholder')}
                          value={interval.value}
                          onChange={(e) => handleUpdateInterval(interval.id, 'value', e.target.value)}
                          disabled={!isEditMode || isSubmitting}
                        />
                      </td>
                      <td className="md:p-2 md:border md:border-form-border mb-2 md:mb-0">
                        <Field1
                          type="date"
                          label={t('carForm.lastCompleted')}
                          value={interval.lastCompleted}
                          onChange={(e) => handleUpdateInterval(interval.id, 'lastCompleted', e.target.value)}
                          disabled={!isEditMode || isSubmitting}
                        />
                      </td>
                      <td className="md:p-2 md:border md:border-form-border text-center">
                        {isEditMode && !isSubmitting && (
                          <div className="flex justify-center items-center py-2">
                            <button 
                              onClick={() => handleRemoveInterval(interval.id)}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all industrial-shadow"
                              title={t('common.remove')}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </FormSection>
        </div>

        {/* Flowing Footer (not sticky) */}
        <div className="px-6 py-8 sm:px-10 bg-slate-50 border-t-2 border-black flex flex-col sm:flex-row gap-4">
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
            <div className="flex items-center gap-4 sm:flex-[2]">
              <AnimatePresence>
                {showRequiredError && (
                  <motion.span 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-600 font-bold text-xs uppercase tracking-widest whitespace-nowrap"
                  >
                    Fill required fields!
                  </motion.span>
                )}
              </AnimatePresence>
              <Button1 
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="w-full"
                icon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              >
                {isSubmitting ? t('carForm.processing') : (mode === 'add' ? t('carForm.confirm') : t('carDetails.lockSave'))}
              </Button1>
            </div>
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
