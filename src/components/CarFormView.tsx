import React, { useState, useEffect } from 'react';
import { 
  Check, Edit, Lock, Loader2, Monitor, Trash2, X,
  Car as CarIcon, Upload, Camera, FileText, Verified, 
  Settings, Plus, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { getDrivePreviewUrl, getDriveImageUrl } from '../lib/gas';
import { useStatus } from '../contexts/StatusContext';
import { useNotification } from '../contexts/NotificationContext';
import { Car, MaintenanceInterval, EssentialItem } from '../types';
import Button1 from './Button1';
import ImageToPdf from './tools/ImageToPdf';
import { FUEL_TYPES, CAR_STATUSES, TRANSMISSIONS } from '../constants';
import ItemSection from './itemSection';
import ModalSection1 from './modalSection1';

const Label = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#0066FF] mb-2 flex items-center gap-1">
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

import { uploadFile, deleteFiles, listFolderFiles } from '../lib/storage';

const ColorPicker = ({ label, value, onChange, disabled }: { label: string, value: string, onChange: (c: string) => void, disabled?: boolean }) => {
  const colors = [
    { name: 'white', hex: '#FFFFFF', border: 'border-slate-200' },
    { name: 'black', hex: '#000000', border: 'border-black' },
    { name: 'green', hex: '#10B981', border: 'border-green-600' },
    { name: 'yellow', hex: '#FACC15', border: 'border-yellow-600' },
    { name: 'silver', hex: '#94A3B8', border: 'border-slate-400' },
    { name: 'blue', hex: '#3B82F6', border: 'border-blue-600' },
    { name: 'red', hex: '#EF4444', border: 'border-red-600' },
    { name: 'orange', hex: '#F97316', border: 'border-orange-600' },
  ];

  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 px-1">
        {colors.map((c) => (
          <button
            key={c.name}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c.name)}
            className={`w-8 h-8 rounded-full border transition-all ${c.border} ${value === c.name ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
            style={{ backgroundColor: c.hex }}
            title={c.name}
          />
        ))}
      </div>
    </div>
  );
};

const FilePicker = ({ 
  label, 
  file, 
  url, 
  onFileChange, 
  isSubmitting, 
  onRemove,
  accept = "image/*,application/pdf"
}: any) => {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const hasContent = !!(file || url);
  const displayLabel = file ? file.fileName : (url ? `[ LINKED: ${label.toUpperCase()} ]` : label);
  
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Label>{label}</Label>
      <input 
        type="file" 
        ref={inputRef}
        onChange={(e) => onFileChange(e)}
        accept={accept}
        className="hidden"
      />
      
      <div className="flex flex-col gap-3 w-full min-w-0">
        <button 
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-11 px-6 bg-white border-2 border-black rounded-[12px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all disabled:bg-slate-50 disabled:text-black/30 disabled:border-black/10 overflow-hidden bg-clip-padding shrink-0 w-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none"
        >
          {t('clientForm.uploadFile', 'Upload')}
          <Upload className="w-3.5 h-3.5" />
        </button>
        
        {hasContent ? (
          <div 
            onClick={() => {
              if (url) {
                window.open(getDrivePreviewUrl(url), '_blank');
              }
            }}
            className={`flex-1 flex items-center justify-between px-4 h-11 border-2 rounded-[12px] overflow-hidden min-w-0 w-full transition-all cursor-pointer hover:shadow-md active:scale-[0.98]
              ${url ? 'bg-blue-50 border-blue-600/40 hover:bg-blue-100 shadow-sm' : 'bg-slate-50 border-black/10'}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className={`w-4 h-4 shrink-0 ${url ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest truncate ${url ? 'text-blue-900' : 'text-slate-500'}`}>
                {displayLabel}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {url && (
                <div className="p-1.5 text-blue-600">
                  <Monitor className="w-4 h-4" />
                </div>
              )}
              {!isSubmitting && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  className="p-1.5 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-11 flex items-center px-4 bg-slate-50 border-2 border-dashed border-black/10 rounded-[12px] w-full">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/20 italic">No Document</span>
          </div>
        )}
      </div>
    </div>
  );
};

const FileDropZone = ({ 
  label, 
  file, 
  url, 
  onFileChange, 
  isSubmitting, 
  onRemove,
  accept = "image/*"
}: any) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isPdf = accept.includes('pdf');

  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <input 
        type="file" 
        ref={inputRef}
        onChange={(e) => onFileChange(e)}
        accept={accept}
        className="hidden"
      />
      <div 
        onClick={() => {
          if (!isSubmitting && !url) {
            inputRef.current?.click();
          } else if (url) {
            window.open(getDrivePreviewUrl(url), '_blank');
          } else {
            inputRef.current?.click();
          }
        }}
        className={`w-full aspect-video border border-black rounded-[12px] bg-white flex flex-col items-center justify-center transition-all overflow-hidden bg-clip-padding relative group ${!isSubmitting ? 'cursor-pointer hover:ring-4 hover:ring-slate-100' : url ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'}`}
      >
        {(file || url) ? (
          <>
            {isPdf || (file && file.contentType === 'application/pdf') ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <span className="text-[10px] font-bold text-black px-4 text-center truncate w-full">
                  {file ? file.fileName : 'PDF DOCUMENT'}
                </span>
                <div className="mt-1 text-[8px] font-black uppercase text-blue-600 group-hover:underline">
                  {!isSubmitting ? 'CHANGE PDF' : 'VIEW PDF'}
                </div>
              </div>
            ) : (
              <img 
                src={file ? `data:${file.contentType};base64,${file.base64Data}` : (getDriveImageUrl(url) || undefined)} 
                alt={label} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
              {url && (
                <div className="flex flex-col items-center gap-1">
                   <Monitor className="w-8 h-8 text-white drop-shadow-md" />
                   <span className="text-[8px] font-black text-white uppercase tracking-widest">View File</span>
                </div>
              )}
              {!isSubmitting && (
                <button 
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  className="mt-2 px-4 py-1.5 bg-white text-black text-[8px] font-black uppercase tracking-widest rounded-full hover:bg-blue-600 hover:text-white transition-all"
                >
                  Change {isPdf ? 'PDF' : 'Image'}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {isPdf ? <FileText className="w-8 h-8 text-black/20" /> : <Camera className="w-8 h-8 text-black/20" />}
            <p className="mt-2 text-[10px] font-extrabold uppercase tracking-widest text-black/40">Upload</p>
          </>
        )}
      </div>
      {(file || url) && !isSubmitting && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="mt-2 text-[9px] font-extrabold text-red-500 uppercase tracking-widest flex items-center gap-1 hover:underline px-1"
        >
          <Trash2 className="w-3 h-3" /> Remove
        </button>
      )}
    </div>
  );
};

const InputField = (props: any) => {
  const { label, required, ...rest } = props;
  return (
    <div className="flex flex-col">
      {label && <Label required={required}>{label}</Label>}
      <input 
        {...rest}
        className={`w-full h-11 bg-white border border-black rounded-[12px] px-5 text-sm font-bold focus:outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out disabled:bg-slate-50 disabled:text-black disabled:cursor-default overflow-hidden bg-clip-padding relative z-0 ${props.className || ''}`}
      />
    </div>
  );
};

const SelectField = (props: any) => {
  const { label, required, children, ...rest } = props;
  return (
    <div className="flex flex-col">
      {label && <Label required={required}>{label}</Label>}
      <select 
        {...rest}
        className={`w-full h-11 bg-white border border-black rounded-[12px] px-5 text-sm font-bold focus:outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out disabled:bg-slate-50 disabled:text-black disabled:cursor-default appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-size-[16px] bg-position-[right_16px_center] bg-no-repeat overflow-hidden bg-clip-padding relative z-0 ${props.className || ''}`}
      >
        {children}
      </select>
    </div>
  );
};

const TextareaField = (props: any) => {
  const { label, required, ...rest } = props;
  return (
    <div className="flex flex-col">
      {label && <Label required={required}>{label}</Label>}
      <textarea 
        {...rest}
        className={`w-full h-24 bg-white border border-black rounded-[12px] px-5 py-4 text-sm font-bold focus:outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out disabled:bg-slate-50 disabled:text-black disabled:cursor-default overflow-hidden bg-clip-padding relative z-0 ${props.className || ''}`}
      />
    </div>
  );
};

interface CarFormViewProps {
  initialData?: Car | null;
  onSubmit?: (car: any) => void;
  onDelete?: (id: string) => void;
  onOptimisticUpdate?: (car: any) => void;
  onOptimisticDelete?: (id: string) => void;
  onSuccess?: () => void;
}

export default function CarFormView({ initialData, onSubmit, onDelete, onOptimisticUpdate, onOptimisticDelete, onSuccess }: CarFormViewProps) {
  const { t } = useTranslation();
  const { setStatus: setGlobalStatus } = useStatus();
  const { showToast, confirm: customConfirm } = useNotification();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [fuelType, setFuelType] = useState<any>('');
  const [transmission, setTransmission] = useState<any>('Manual');
  const [odometer, setOdometer] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [status, setStatus] = useState<any>('Available');
  const [notes, setNotes] = useState('');
  const [gpsSim, setGpsSim] = useState('');
  const [showRequiredError, setShowRequiredError] = useState(false);
  const [seats, setSeats] = useState('');

  const [registrationExpiry, setRegistrationExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [techInspectionExpiry, setTechInspectionExpiry] = useState('');
  const [taxRenewalExpiry, setTaxRenewalExpiry] = useState('');
  const [vignetteExpiry, setVignetteExpiry] = useState('');
  const [firstUseDate, setFirstUseDate] = useState('');

  // Media & Files
  const [carImage, setCarImage] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [docFile, setDocFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [regCardFile, setRegCardFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [vignetteFile, setVignetteFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [regCardUrl, setRegCardUrl] = useState('');
  const [insuranceUrl, setInsuranceUrl] = useState('');
  const [vignetteUrl, setVignetteUrl] = useState('');
  const [showPdfTool, setShowPdfTool] = useState(false);

  // Dynamic Lists State
  const [essentials, setEssentials] = useState<string[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [maintenanceMap, setMaintenanceMap] = useState<Record<string, { value: string, lastCompleted: string }>>({});

  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setShowRequiredError(false);
    setUploadError(null);
    
    if (initialData) {
      console.log('--- DEBUG: LOADING CAR FOR EDIT ---', {
        id: initialData.id,
        image: initialData.image_url,
        docs: initialData.documentation_url,
        reg: initialData.registration_card_url,
        ins: initialData.insurance_url,
        vig: initialData.vignette_url
      });

      setBrand(initialData.brand || '');
      setModel(initialData.model || '');
      setPlate(initialData.plate || '');
      setColor(initialData.color || '');
      setFuelType(initialData.fuel_type || '');
      setTransmission(initialData.transmission || 'Manual');
      setOdometer(initialData.odometer?.toString() || '');
      setDailyRate(initialData.daily_rate?.toString() || '');
      setStatus(initialData.status || 'Available');
      setNotes(initialData.notes || '');
      setGpsSim(initialData.gps_sim || '');
      setSeats(initialData.seats?.toString() || '5');
      
      setRegistrationExpiry(initialData.registration_expiry || '');
      setInsuranceExpiry(initialData.insurance_expiry || '');
      setTechInspectionExpiry(initialData.tech_inspection_expiry || '');
      setTaxRenewalExpiry(initialData.tax_renewal_expiry || '');
      setVignetteExpiry(initialData.vignette_expiry || '');
      setFirstUseDate(initialData.first_use_date || '');
      
      setImageUrl(initialData.image_url || '');
      setDocUrl(initialData.documentation_url || '');
      setRegCardUrl(initialData.registration_card_url || '');
      setInsuranceUrl(initialData.insurance_url || '');
      setVignetteUrl(initialData.vignette_url || '');

      setEssentials(initialData.essentials?.filter(e => e.checked).map(e => e.name) || initialData.essentials?.map(e => e.name) || []);
      
      const mTable: Record<string, { value: string, lastCompleted: string }> = {};
      serviceOptions.forEach(opt => {
        mTable[opt.value] = { value: '', lastCompleted: '' };
      });
      (initialData.intervals || []).forEach(interval => {
        mTable[interval.type] = {
          value: (interval.value === '0' || !interval.value) ? '' : interval.value,
          lastCompleted: interval.lastCompleted || ''
        };
      });
      setMaintenanceMap(mTable);
      setSelectedServiceType(serviceOptions[0].value);
    } else {
      setBrand('');
      setModel('');
      setPlate('');
      setColor('');
      setFuelType('');
      setTransmission('Manual');
      setOdometer('');
      setDailyRate('');
      setStatus('Available');
      setNotes('');
      setGpsSim('');
      setSeats('');
      setRegistrationExpiry('');
      setInsuranceExpiry('');
      setTechInspectionExpiry('');
      setTaxRenewalExpiry('');
      setVignetteExpiry('');
      setFirstUseDate('');
      setImageUrl('');
      setDocUrl('');
      setRegCardUrl('');
      setInsuranceUrl('');
      setVignetteUrl('');
      setEssentials([]);
      
      const mTable: Record<string, { value: string, lastCompleted: string }> = {};
      serviceOptions.forEach(opt => {
        mTable[opt.value] = { value: '', lastCompleted: '' };
      });
      setMaintenanceMap(mTable);
      setSelectedServiceType(serviceOptions[0].value);
    }
    setCarImage(null);
    setDocFile(null);
    setRegCardFile(null);
    setInsuranceFile(null);
    setVignetteFile(null);
  }, [initialData]);

  const serviceOptions = [
    { key: 'engineOil', value: "Engine Oil" },
    { key: 'coolant', value: "Coolant (Antigel)" },
    { key: 'brakeFluid', value: "Brake Fluid" },
    { key: 'gearboxOil', value: "Gearbox Oil" },
    { key: 'airFilter', value: "Air Filter" },
    { key: 'fuelFilter', value: "Fuel Filter" },
    { key: 'acFilter', value: "Cabin/AC Filter" },
    { key: 'brakePads', value: "Brake Pads (Plaquettes de frein)" },
    { key: 'tires', value: "Tires" },
    { key: 'wipers', value: "Wiper Blades" },
    { key: 'timingBelt', value: "Timing Belt (Courroie)" },
    { key: 'battery', value: "Battery" },
    { key: 'sparkPlugs', value: "Spark Plugs (Bougies)" },
    { key: 'shocks', value: "Shock Absorbers" }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (data: any) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setter({
        base64Data,
        fileName: file.name,
        contentType: file.type
      });
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

  const handleUpdateMaintenance = (field: 'value' | 'lastCompleted', val: string) => {
    setMaintenanceMap(prev => ({
      ...prev,
      [selectedServiceType]: {
        ...prev[selectedServiceType],
        [field]: val
      }
    }));
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
    setGlobalStatus(t('common.processing'), 'processing', 0);

    // Optimistic Update & Early Close
    const optimisticPayload = {
      id: initialData?.id || `temp-${Date.now()}`,
      brand,
      model,
      plate,
      color,
      fuel_type: fuelType,
      transmission,
      odometer: odometer === '' ? 0 : (parseInt(odometer) || 0),
      daily_rate: dailyRate === '' ? 0 : (parseFloat(dailyRate) || 0),
      status,
      gps_sim: gpsSim,
      seats: (seats === '' || isNaN(parseInt(seats))) ? 5 : parseInt(seats),
      notes: notes,
      registration_expiry: registrationExpiry || null,
      insurance_expiry: insuranceExpiry || null,
      tech_inspection_expiry: techInspectionExpiry || null,
      tax_renewal_expiry: taxRenewalExpiry || null,
      vignette_expiry: vignetteExpiry || null,
      first_use_date: firstUseDate || null,
      image_url: carImage ? `data:${carImage.contentType};base64,${carImage.base64Data}` : imageUrl,
      documentation_url: docUrl,
      registration_card_url: regCardUrl,
      insurance_url: insuranceUrl,
      vignette_url: vignetteUrl,
      essentials: essentials.map(name => ({ id: name, name, checked: true })),
      intervals: Object.entries(maintenanceMap)
        .filter(([_, data]) => data.value || data.lastCompleted)
        .map(([type, data]) => ({
          id: type,
          type,
          value: data.value,
          lastCompleted: data.lastCompleted,
        })),
    };

    if (onOptimisticUpdate) {
      // We'll call onOptimisticUpdate AFTER success to ensure backend integrity 
      // and avoid duplicate entries with temp IDs.
    }
    // onClose(); // Removed from here, will close after success

    try {
      let finalImageUrl = imageUrl || '';
      let finalDocUrl = docUrl;
      let finalRegCardUrl = regCardUrl;
      let finalInsuranceUrl = insuranceUrl;
      let finalVignetteUrl = vignetteUrl;

      const carFolderName = `${brand} ${model} ${plate}`.trim();
      let oldCarFolderName: string | undefined = undefined;

      if (initialData?.id) {
        oldCarFolderName = `${initialData.brand} ${initialData.model} ${initialData.plate}`.trim();
        
        if (oldCarFolderName !== carFolderName) {
          const oldFiles = await listFolderFiles('car-files', oldCarFolderName);
          if (oldFiles.length > 0) await deleteFiles('car-files', oldFiles);
        }
      }

      // Handle File Uploads via Supabase Storage
      if (carImage) {
        setGlobalStatus(t('common.processing'), 'processing');
        const url = await uploadFile('car-files', carImage.base64Data, carImage.fileName, carImage.contentType, carFolderName);
        if (url) {
          finalImageUrl = url;
          setImageUrl(url);
        } else {
          console.warn('Image upload failed');
        }
      }

      if (docFile) {
        setGlobalStatus(t('common.processing'), 'processing');
        const url = await uploadFile('car-files', docFile.base64Data, docFile.fileName, docFile.contentType, carFolderName);
        if (url) {
          finalDocUrl = url;
          setDocUrl(url);
        } else {
          console.warn('Doc upload failed');
        }
      }

      if (regCardFile) {
        setGlobalStatus(t('common.processing'), 'processing');
        const url = await uploadFile('car-files', regCardFile.base64Data, regCardFile.fileName, regCardFile.contentType, carFolderName);
        if (url) {
          finalRegCardUrl = url;
          setRegCardUrl(url);
        }
      }

      if (insuranceFile) {
        setGlobalStatus(t('common.processing'), 'processing');
        const url = await uploadFile('car-files', insuranceFile.base64Data, insuranceFile.fileName, insuranceFile.contentType, carFolderName);
        if (url) {
          finalInsuranceUrl = url;
          setInsuranceUrl(url);
        }
      }

      if (vignetteFile) {
        setGlobalStatus(t('common.processing'), 'processing');
        const url = await uploadFile('car-files', vignetteFile.base64Data, vignetteFile.fileName, vignetteFile.contentType, carFolderName);
        if (url) {
          finalVignetteUrl = url;
          setVignetteUrl(url);
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
          gps_sim: gpsSim,
          seats: (seats === '' || isNaN(parseInt(seats))) ? 5 : parseInt(seats),
          notes: notes,
          registration_expiry: registrationExpiry || null,
          insurance_expiry: insuranceExpiry || null,
          tech_inspection_expiry: techInspectionExpiry || null,
          tax_renewal_expiry: taxRenewalExpiry || null,
          vignette_expiry: vignetteExpiry || null,
          first_use_date: firstUseDate || null,
          image_url: finalImageUrl,
          documentation_url: finalDocUrl,
          registration_card_url: finalRegCardUrl,
          insurance_url: finalInsuranceUrl,
          vignette_url: finalVignetteUrl,
          essentials: essentials.map(name => ({ id: name, name, checked: true })),
          intervals: Object.entries(maintenanceMap)
            .filter(([_, data]) => data.value || data.lastCompleted)
            .map(([type, data]) => ({
              id: type,
              type,
              value: data.value,
              lastCompleted: data.lastCompleted,
            })),
        };

      if (initialData?.id) {
        const { data, error } = await supabase
          .from('cars')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', initialData.id)
          .select()
          .single();
        if (error) throw error;
        
        if (onOptimisticUpdate && data) {
          onOptimisticUpdate(data);
        }
        
        setGlobalStatus(t('common.actionCompleted'), 'success');
        showToast(t('common.success'), 'success');
        onSubmit?.(payload);
        onSuccess?.();
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
        
        setGlobalStatus(t('common.actionCompleted'), 'success');
        showToast(t('common.success'), 'success');
        onSubmit?.(payload);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Update error:', error);
      setGlobalStatus(`${t('common.error')}: ${error.message || ''}`, 'error');
      showToast(error.message || t('common.error'), 'error');
    }
  };

  const handleRemoveCar = async () => {
    if (!initialData?.id) return;
    const confirmed = await customConfirm({
      title: t('carDetails.removeCar'),
      message: t('carDetails.removeCarConfirm'),
      confirmLabel: t('common.remove'),
      cancelLabel: t('common.cancel'),
      type: 'danger'
    });

    if (confirmed) {
      setIsSubmitting(true);
      setGlobalStatus(t('common.processing'), 'processing', 0);
      
      // Final Delete
      try {
        const carFolderName = `${brand} ${model} ${plate}`.trim();
        // Delete folder from Supabase Storage
        setGlobalStatus(t('common.processing'), 'processing');
        const oldFiles = await listFolderFiles('car-files', carFolderName);
        if (oldFiles.length > 0) await deleteFiles('car-files', oldFiles);

        const { error } = await supabase
          .from('cars')
          .delete()
          .eq('id', carData.id);
        if (error) throw error;
        
        if (onOptimisticDelete && initialData.id) {
          onOptimisticDelete(initialData.id);
        }
        
        setGlobalStatus(t('common.actionCompleted'), 'success');
        showToast(t('common.dataDeleted'), 'success');
        onDelete?.(initialData.id);
        onSuccess?.();
      } catch (error: any) {
        console.error('Delete error:', error);
        setGlobalStatus(`${t('common.error')}`, 'error');
        showToast(t('common.error'), 'error');
      }
    }
  };

  return (
    <div className="bg-slate-50/30 w-full py-4 sm:py-10">
      <div className="px-4 sm:px-10 space-y-8">
        <ModalSection1 
          title={initialData ? t('carDetails.title') : t('carForm.title')}
        >
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8">
            <InputField 
              label={t('carForm.brand')}
              value={brand}
              onChange={(e: any) => setBrand(e.target.value)}
              placeholder={t('carForm.placeholder')}
              disabled={isSubmitting}
              required
            />
            <InputField 
              label={t('carForm.model')}
              value={model}
              onChange={(e: any) => setModel(e.target.value)}
              placeholder={t('carForm.placeholder')}
              disabled={isSubmitting}
              required
            />
            <InputField 
              label={t('carForm.plate')}
              value={plate}
              onChange={(e: any) => setPlate(e.target.value)}
              placeholder={t('carForm.placeholder')}
              className="uppercase"
              disabled={isSubmitting}
              required
            />
            <ColorPicker
              label={t('carForm.color')}
              value={color}
              onChange={setColor}
              disabled={isSubmitting}
            />
            <InputField 
              label={t('carForm.dailyRate')}
              type="number"
              value={dailyRate}
              onChange={(e: any) => setDailyRate(e.target.value)}
              placeholder={t('carForm.placeholder')}
              disabled={isSubmitting}
              required
            />
            <InputField 
              label={t('carForm.odometer')}
              type="number"
              value={odometer}
              onChange={(e: any) => setOdometer(e.target.value)}
              placeholder={t('carForm.placeholder')}
              disabled={isSubmitting}
            />
            <SelectField 
              label={t('carForm.status')}
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
              className={`border-s-4 ${getStatusColor()} font-bold`}
              disabled={isSubmitting}
            >
              <option value="Available" className="text-green-600 font-bold">{t('common.available')}</option>
              <option value="Unavailable" className="text-red-600 font-bold">{t('common.unavailable')}</option>
              <option value="In Maintenance" className="text-amber-600 font-bold">{t('common.maintenance')}</option>
              <option value="Decommissioned" className="text-slate-600 font-bold">{t('common.decommissioned')}</option>
            </SelectField>
          </div>
        </ModalSection1>

        <ModalSection1 title={t('carForm.documents')}>
          <div className="w-full space-y-8">
            {uploadError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-[12px] flex items-center gap-3 animate-pulse">
              <X className="w-6 h-6 text-red-600" />
              <p className="text-xs font-black uppercase text-red-900 tracking-widest">{uploadError}</p>
            </div>
          )}

            <div className="flex flex-col lg:flex-row gap-4">
              <div className="w-full lg:w-80 shrink-0">
                <FileDropZone
                  label={t('carForm.uploadImage', 'Vehicle Image')}
                  file={carImage}
                  url={imageUrl}
                  onFileChange={(e: any) => handleFileChange(e, setCarImage)}
                  isSubmitting={isSubmitting}
                  onRemove={() => { setCarImage(null); setImageUrl(''); }}
                />
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FilePicker
                  label={t('carForm.registrationCard')}
                  file={regCardFile}
                  url={regCardUrl}
                  onFileChange={(e: any) => handleFileChange(e, setRegCardFile)}
                  isSubmitting={isSubmitting}
                  onRemove={() => { setRegCardFile(null); setRegCardUrl(''); }}
                />

                <FilePicker
                  label={t('carForm.insurance')}
                  file={insuranceFile}
                  url={insuranceUrl}
                  onFileChange={(e: any) => handleFileChange(e, setInsuranceFile)}
                  isSubmitting={isSubmitting}
                  onRemove={() => { setInsuranceFile(null); setInsuranceUrl(''); }}
                />

                <FilePicker
                  label={t('carForm.vignette')}
                  file={vignetteFile}
                  url={vignetteUrl}
                  onFileChange={(e: any) => handleFileChange(e, setVignetteFile)}
                  isSubmitting={isSubmitting}
                  onRemove={() => { setVignetteFile(null); setVignetteUrl(''); }}
                />
              </div>
            </div>
            
            <div className="w-full pt-4 border-t border-black/5">
              <div className="flex flex-col gap-3">
                <Label>{t('carForm.pdfLabel')} (All-in-one Documentation)</Label>
                <input 
                  type="file" 
                  ref={docInputRef}
                  onChange={(e) => handleFileChange(e, setDocFile)}
                  accept="application/pdf"
                  className="hidden"
                />
                <div className="flex flex-col gap-4 items-start w-full min-w-0">
                  <div className="flex flex-col gap-3 items-start w-full min-w-0">
                    {!isSubmitting && (
                      <div className="flex gap-2 shrink-0 w-full">
                        <button 
                          onClick={() => docInputRef.current?.click()}
                          className="flex-1 h-11 bg-white border-2 border-black rounded-[12px] px-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none overflow-hidden bg-clip-padding"
                          type="button"
                        >
                          {t('carForm.uploadPdf')}
                          <Upload className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setShowPdfTool(true)}
                          className="w-11 h-11 bg-white border-2 border-black rounded-[12px] flex items-center justify-center hover:bg-slate-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none overflow-hidden bg-clip-padding"
                          type="button"
                          title={t('tools.imageToPdf')}
                        >
                          <Monitor className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    )}

                    {(docFile || docUrl) && (
                      <div 
                        onClick={() => {
                          if (docUrl) {
                            window.open(getDrivePreviewUrl(docUrl), '_blank');
                          }
                        }}
                        className={`flex-1 flex items-center justify-between px-4 h-11 border-2 rounded-[12px] overflow-hidden min-w-0 w-full transition-all cursor-pointer hover:shadow-md active:scale-[0.98]
                          ${docUrl ? 'bg-blue-50 border-blue-600/20 hover:bg-blue-100' : 'bg-slate-50 border-black/10'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className={`w-4 h-4 shrink-0 ${docUrl ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest truncate ${docUrl ? 'text-blue-900' : 'text-slate-500'}`}>
                            {docFile ? docFile.fileName : t('carForm.docs', 'CAR DOCUMENTATION')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {docUrl && (
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); window.open(getDrivePreviewUrl(docUrl), '_blank'); }}
                              className="p-1.5 hover:bg-blue-200 rounded-full text-blue-600 transition-colors"
                            >
                              <Monitor className="w-4 h-4" />
                            </button>
                          )}
                          {!isSubmitting && (
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDocFile(null); setDocUrl(''); }} 
                              className="p-1.5 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {!docFile && !docUrl && (
                      <div className="h-11 flex items-center px-4 bg-slate-50 border-2 border-dashed border-black/10 rounded-[12px] w-full">
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/20 italic">No Documentation</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[9px] font-bold text-black/40 uppercase tracking-[0.2em] px-2 italic whitespace-nowrap">
                    * {t('carForm.pdfHint', 'Merge images into PDF if needed using the tool icon')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ModalSection1>

        <ModalSection1 title={t('carForm.otherDetails')}>
          <div className="w-full flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8">
              <InputField 
                label={t('carForm.firstUse')}
                type="date"
                value={firstUseDate}
                onChange={(e: any) => setFirstUseDate(e.target.value)}
                disabled={isSubmitting}
              />
              
              <InputField
                  label={t('carForm.registrationExpir')}
                  type="date"
                  value={registrationExpiry}
                  onChange={(e: any) => setRegistrationExpiry(e.target.value)}
                  disabled={isSubmitting}
              />
              <InputField
                  label={t('carForm.insuranceExpir')}
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e: any) => setInsuranceExpiry(e.target.value)}
                  disabled={isSubmitting}
              />
              <InputField
                  label={t('carForm.vignetteExpir')}
                  type="date"
                  value={vignetteExpiry}
                  onChange={(e: any) => setVignetteExpiry(e.target.value)}
                  disabled={isSubmitting}
              />

              <div className="flex flex-col">
                <Label>{t('carForm.transmission')}</Label>
                <div className="flex bg-white border border-black rounded-[12px] h-11 overflow-hidden bg-clip-padding">
                  {TRANSMISSIONS.map((trans, index) => (
                    <button 
                      key={trans}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setTransmission(trans)}
                      className={`flex-1 font-extrabold text-[10px] uppercase tracking-widest transition-all ${index !== 0 ? 'border-l border-black' : ''} ${transmission === trans ? 'bg-blue-600 text-white shadow-inner' : 'bg-slate-100/50 text-black/40 hover:bg-slate-100 hover:text-black/60'}`}
                    >
                      {t(`carForm.trans${trans}`)}
                    </button>
                  ))}
                </div>
              </div>

              <SelectField 
                label={t('carForm.fuelType')}
                value={fuelType}
                onChange={(e: any) => setFuelType(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="" disabled>{t('common.select', 'Select')}</option>
                {FUEL_TYPES.map(ft => (
                  <option key={ft} value={ft}>{t(`carForm.fuel${ft}`)}</option>
                ))}
              </SelectField>

              <InputField 
                label={t('carForm.gpsSim')}
                value={gpsSim}
                onChange={(e: any) => setGpsSim(e.target.value)}
                placeholder={t('carForm.placeholder')}
                disabled={isSubmitting}
              />

              <InputField 
                label={t('carForm.seats')}
                type="number"
                value={seats}
                onChange={(e: any) => setSeats(e.target.value)}
                placeholder={t('carForm.placeholder')}
                disabled={isSubmitting}
              />
            </div>

            <ItemSection 
              items={essentials}
              onChange={(items) => setEssentials(items)}
              isEdit={!isSubmitting}
              isEditLocked={false}
              disabled={false}
            />

            <TextareaField 
              label={t('carForm.notes')}
              value={notes}
              onChange={(e: any) => setNotes(e.target.value)}
              placeholder={t('carForm.placeholder')}
              disabled={isSubmitting}
            />
          </div>
        </ModalSection1>

        <ModalSection1 title={t('carForm.maintenance')}>
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
            <SelectField
              label={t('carForm.maintenanceType', 'Select Maintenance Category')}
              value={selectedServiceType}
              onChange={(e: any) => setSelectedServiceType(e.target.value)}
              disabled={isSubmitting}
            >
              {serviceOptions.map(opt => (
                <option key={opt.key} value={opt.value}>
                  {t(`carForm.serviceOptions.${opt.key}`, opt.value)}
                </option>
              ))}
            </SelectField>
            
            <InputField
              label={t('carForm.intervalValue')}
              placeholder={t('carForm.placeholder')}
              type="number"
              value={maintenanceMap[selectedServiceType]?.value || ''}
              onChange={(e: any) => handleUpdateMaintenance('value', e.target.value)}
              disabled={isSubmitting}
            />
            
            <InputField
              type="date"
              label={t('carForm.lastCompleted')}
              value={maintenanceMap[selectedServiceType]?.lastCompleted || ''}
              onChange={(e: any) => handleUpdateMaintenance('lastCompleted', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </ModalSection1>
      </div>


      <div className="px-6 py-10 sm:px-10 bg-slate-50 border-t border-black/10 flex flex-col sm:flex-row justify-end items-center gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AnimatePresence>
            {showRequiredError && (
              <motion.span 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-500 font-black text-[10px] uppercase tracking-widest whitespace-nowrap"
              >
                {t('carForm.fillRequiredFields')}
              </motion.span>
            )}
          </AnimatePresence>
          <button 
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="w-full sm:w-40 h-12 bg-blue-600 border border-blue-600 rounded-[12px] text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 overflow-hidden bg-clip-padding"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isSubmitting ? t('carForm.processing') : (initialData ? t('common.save', 'Save Changes') : t('carForm.confirm'))}
          </button>
        </div>

        {initialData && (
          <button 
            onClick={handleRemoveCar}
            disabled={isSubmitting}
            className="w-full sm:w-40 h-12 bg-red-600 border border-black rounded-[12px] text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 overflow-hidden bg-clip-padding"
          >
            <Trash2 className="w-4 h-4" /> {t('carDetails.removeCar')}
          </button>
        )}
      </div>


      <AnimatePresence>
        {showPdfTool && (
          <div className="fixed inset-0 z-75 flex items-center justify-center bg-midnight-ink/90 backdrop-blur-md p-4 sm:p-20 overflow-y-auto no-scrollbar">
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
  );
}
