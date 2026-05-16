import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, User, Phone, CreditCard, 
  Car as CarIcon, Calendar, Monitor, ClipboardList, 
  Upload, Star, Plus, Check, Edit, Lock, Trash2, CheckCircle, Loader2, FileText,
  AlertCircle, ChevronRight, ChevronDown, Gauge, Fuel, Sparkles, Files, XCircle, ClipboardPaste, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { getDriveImageUrl } from '../lib/gas';
import { useReservations } from '../hooks/useReservations';
import { useVerifiedTime } from '../hooks/useVerifiedTime';
import { useStatus } from '../contexts/StatusContext';
import { fileToBase64 } from '../lib/utils';
import { Customer } from '../types';

import BaseModal from './BaseModal';
import Button1 from './Button1';
import ImageToPdf from './tools/ImageToPdf';
import ClientModal from './ClientModal';
import ItemSection from './itemSection';

import ModalSection1 from './modalSection1';

const Label = ({ children, required, className = "" }: { children: React.ReactNode, required?: boolean, className?: string }) => (
  <label className={`text-[10px] font-black uppercase tracking-[0.15em] text-[#0066FF] mb-2 flex items-center gap-1 ${className}`}>
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

const ViewOnlyField = ({ label, value, icon: Icon, className = "", containerClassName = "w-full" }: any) => (
  <div className={`flex flex-col min-w-0 ${containerClassName}`}>
    {label && <Label>{label}</Label>}
    <div className={`h-11 bg-slate-50/50 border border-black/10 rounded-[12px] px-5 flex items-center gap-3 min-w-0 ${className}`}>
      {Icon && <Icon className="w-4 h-4 text-black/40 shrink-0" />}
      <span className="text-sm font-bold text-black/80 truncate">{value || '---'}</span>
    </div>
  </div>
);

const InputField = (props: any) => {
  const { label, required, containerClassName = "w-full", rightElement, ...rest } = props;
  return (
    <div className={`flex flex-col min-w-0 ${containerClassName}`}>
      {label && <Label required={required}>{label}</Label>}
      <div className="flex relative items-stretch w-full min-w-0">
        <input 
          {...rest}
          className={`flex-1 min-w-0 h-11 bg-white border border-black rounded-[12px] px-5 text-sm font-bold focus:outline-none focus:border-2 focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out disabled:bg-slate-50 disabled:text-black disabled:cursor-default bg-clip-padding relative z-0 ${rightElement ? 'rounded-r-none border-r-0' : ''} ${props.className || ''}`}
        />
        {rightElement && (
          <div className="flex-shrink-0 flex items-stretch min-w-0">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

const SelectField = (props: any) => {
  const { label, required, children, containerClassName = "w-full", ...rest } = props;
  return (
    <div className={`flex flex-col min-w-0 ${containerClassName}`}>
      {label && <Label required={required}>{label}</Label>}
      <select 
        {...rest}
        className={`w-full min-w-0 h-11 bg-white border border-black rounded-[12px] px-5 text-sm font-bold focus:outline-none focus:border-2 focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out disabled:bg-slate-50 disabled:text-black disabled:cursor-default appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat bg-clip-padding relative z-0 ${props.className || ''}`}
      >
        {children}
      </select>
    </div>
  );
};

const TextareaField = (props: any) => {
  const { label, required, containerClassName = "w-full", ...rest } = props;
  return (
    <div className={`flex flex-col min-w-0 ${containerClassName}`}>
      {label && <Label required={required}>{label}</Label>}
      <textarea 
        {...rest}
        className={`w-full min-w-0 h-24 bg-white border-2 border-black rounded-[12px] px-5 py-4 text-sm font-bold focus:outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out disabled:bg-slate-50 disabled:text-black disabled:cursor-default bg-clip-padding relative z-0 ${props.className || ''}`}
      />
    </div>
  );
};

const MultiFileUpload = ({ label, files, onUpload, onRemove, disabled, error, accept = "image/*,application/pdf", containerClassName = "w-full" }: any) => {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col gap-2 min-w-0 ${containerClassName}`}>
      {label && <Label>{label}</Label>}
      <div className="flex flex-col gap-3 min-w-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = accept;
            input.onchange = (e: any) => onUpload(e);
            input.click();
          }}
          className="h-10 px-6 bg-white border-2 border-black rounded-[12px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none bg-clip-padding relative z-10 shrink-0 w-full"
        >
          <Upload className="w-3.5 h-3.5" />
          {t('common.upload', 'Upload Files')}
        </button>

        <div className="flex flex-wrap gap-2 min-w-0">
          {files.map((file: any, idx: number) => (
            <div 
              key={idx} 
              className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border-2 border-emerald-500/20 rounded-[12px] h-8"
            >
              <FileText className="w-3 h-3 text-emerald-600" />
              <span className="text-[9px] font-bold text-emerald-900 truncate max-w-[100px]">{file.name}</span>
              {!disabled && (
                <button 
                  onClick={() => onRemove(idx)}
                  className="p-1 hover:bg-emerald-100 rounded-full text-emerald-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
};

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  reservationData?: any; // For edit mode
  initialData?: any; // For partial rebooking data in add mode
}

export default function ReservationModal({ 
  isOpen, 
  onClose, 
  mode, 
  reservationData, 
  initialData 
}: ReservationModalProps) {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  const isEdit = mode === 'edit';
  const [isEditLocked, setIsEditLocked] = useState(isEdit);

  // Form State
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [extendedReturnDate, setExtendedReturnDate] = useState('');
  const [dailyRate, setDailyRate] = useState<string | number>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientLicense, setClientLicense] = useState('');
  const [prepayment, setPrepayment] = useState<string | number>('');
  const [depositType, setDepositType] = useState('');
  const [depositAmount, setDepositAmount] = useState<string | number>('');
  const [odometerOut, setOdometerOut] = useState('');
  const [odometerIn, setOdometerIn] = useState('');
  const [fuelOut, setFuelOut] = useState('');
  const [fuelIn, setFuelIn] = useState('');
  const [cleanedBefore, setCleanedBefore] = useState('');
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);

  // New State for Rearranged Modal
  const [prepaymentType, setPrepaymentType] = useState<'fully_paid' | 'amount'>('fully_paid');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchListActive, setIsClientSearchListActive] = useState(false);
  const [isClientViewModalOpen, setIsClientViewModalOpen] = useState(false);

  const resetClientSelection = () => {
    setSelectedCustomer(null);
    setClientName('');
    setClientId('');
    setClientLicense('');
    setClientPhone('');
    setClientSearchQuery('');
  };
  const [isCarSelectorOpen, setIsCarSelectorOpen] = useState(false);
  const [docFiles, setDocFiles] = useState<{
    vehicle_state: any[];
    paper_contract: any[];
    id_card: any[];
    license: any[];
  }>({
    vehicle_state: [],
    paper_contract: [],
    id_card: [],
    license: []
  });
  const [generatedContractFile, setGeneratedContractFile] = useState<any>(null);

  const { createReservation, updateReservation, deleteReservation, loading: isSubmitting } = useReservations();
  const { verifiedTime } = useVerifiedTime();

  // Resources
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [showPdfTool, setShowPdfTool] = useState(false);
  const [clientListActive, setClientListActive] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handlePdfToolAssign = async (pdfResults: any[]) => {
    if (pdfResults.length === 0) return;
    try {
      const result = pdfResults[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setPendingFile({
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

  const navigate = useNavigate();
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Initial Data (Add or Edit)
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && reservationData) {
      setCarBrand(reservationData.carBrand || reservationData.car?.brand || '');
      setCarModel(reservationData.carName?.split(' ')[1] || reservationData.car?.model || '');
      setClientName(reservationData.customer_name || reservationData.client || '');
      setLicensePlate(reservationData.carPlate || reservationData.car?.plate || '');
      setPickupDate(reservationData.start_date?.slice(0, 16) || '');
      setReturnDate(reservationData.end_date?.slice(0, 16) || '');
      setExtendedReturnDate(reservationData.extended_return_date?.slice(0, 16) || '');
      setDailyRate(reservationData.daily_rate || reservationData.car?.daily_rate || '');
      setClientPhone(reservationData.customer_phone || '');
      setPrepayment(reservationData.prepayment || '');
      setSelectedCarId(reservationData.car_id || null);
      setOdometerOut(reservationData.odometer_out?.toString() || '');
      setOdometerIn(reservationData.odometer_in?.toString() || '');
      setFuelOut(reservationData.fuel_level_out?.toString() || '');
      setFuelIn(reservationData.fuel_level_in?.toString() || '');
      setDepositType(reservationData.deposit_type || '');
      setDepositAmount(reservationData.deposit_amount || '');
      setCleanedBefore(reservationData.cleaned_before || '');
      setIncludedItems(reservationData.included_items || []);
      setNotes(reservationData.notes || '');
      setRating(reservationData.rating || 0);
      setClientId(reservationData.customer_id || '');
    } else if (initialData) {
      setCarBrand(initialData.carBrand || initialData.car?.brand || '');
      setCarModel(initialData.carModel || initialData.car?.model || '');
      setLicensePlate(initialData.carPlate || initialData.car?.plate || '');
      setClientName(initialData.customer_name || '');
      setClientPhone(initialData.customer_phone || '');
      setSelectedCarId(initialData.car_id || null);
      setDailyRate(initialData.daily_rate || initialData.car?.daily_rate || '');
      setPrepayment(initialData.prepayment || '');
      setDepositType(initialData.deposit_type || '');
      setDepositAmount(initialData.deposit_amount || '');
      setRating(initialData.rating || 0);
      setNotes(initialData.notes || '');
    } else {
      // RESET
      setCarBrand('');
      setCarModel('');
      setLicensePlate('');
      setPickupDate('');
      setReturnDate('');
      setExtendedReturnDate('');
      setDailyRate('');
      setClientName('');
      setClientPhone('');
      setClientId('');
      setClientLicense('');
      setClientSearchQuery('');
      setSelectedCustomer(null);
      setPrepayment('');
      setDepositType('');
      setDepositAmount('');
      setOdometerOut('');
      setOdometerIn('');
      setFuelOut('');
      setFuelIn('');
      setCleanedBefore('');
      setIncludedItems([]);
      setNotes('');
      setRating(0);
      setSelectedCarId(null);
      setRegistrationStatus(null);
      setDocFiles({
        vehicle_state: [],
        paper_contract: [],
        id_card: [],
        license: []
      });
    }
  }, [isOpen, mode, reservationData, initialData]);

  // Initial items - handled by mode and car selection

  // Resources Fetch
  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      const [{ data: cars }, { data: customers }] = await Promise.all([
        supabase.from('cars').select('id, brand, model, plate, status, daily_rate, odometer, starting_fuel_level, image_url, essentials').neq('status', 'Decommissioned'),
        supabase.from('customers').select('*')
      ]);
      if (cars) setAvailableCars(cars);
      if (customers) {
        setAllCustomers(customers);
      }
    };
    fetchData();
  }, [isOpen]);

  // Fill missing car-specific fields from availableCars when editing
  useEffect(() => {
    if (!isEdit || !selectedCarId || availableCars.length === 0) return;
    const car = availableCars.find(c => c.id === selectedCarId);
    if (!car) return;
    if (!dailyRate) setDailyRate(car.daily_rate || '');
    if (!odometerOut) setOdometerOut(car.odometer?.toString() || '');
    if (!carBrand) setCarBrand(car.brand || '');
    if (!carModel) setCarModel(car.model || '');
    if (!licensePlate) setLicensePlate(car.plate || '');
  }, [availableCars, isEdit, selectedCarId]);

  const [duration, setDuration] = useState('0 Days, 0 Hours');
  const [totalPrice, setTotalPrice] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  const [reservationState, setReservationState] = useState({ 
    label: 'measuring...', 
    color: 'bg-slate-200 text-slate-700', 
    borderColor: '#475569' 
  });

  useEffect(() => {
    const calculate = () => {
      const now = verifiedTime;
      const start = new Date(pickupDate);
      const standardEnd = new Date(returnDate);
      const extEnd = extendedReturnDate ? new Date(extendedReturnDate) : null;
      const end = (extEnd && !isNaN(extEnd.getTime())) ? extEnd : standardEnd;

      if (pickupDate && (returnDate || extendedReturnDate)) {
        if (now < start) {
          setReservationState({ 
            label: 'Reserved', 
            color: 'bg-slate-header text-white', 
            borderColor: '#475569' 
          });
        } else if (now > end) {
          setReservationState({ 
            label: 'Overdue', 
            color: 'bg-red-600 text-white', 
            borderColor: '#DC2626' 
          });
        } else {
          setReservationState({ 
            label: 'Active', 
            color: 'bg-primary text-white', 
            borderColor: '#31A984' 
          });
        }
      }

      if (start.getTime() && end.getTime() && end > start) {
        const diffMs = end.getTime() - start.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);
        const d = Math.floor(totalHours / 24);
        const h = Math.floor(totalHours % 24);
        setDuration(`${d} ${t('reservations.form.days', 'Days')}, ${h} ${t('reservations.form.hours', 'Hours')}`);

        const billableDays = Math.ceil(totalHours / 24);
        const rate = typeof dailyRate === 'string' ? parseFloat(dailyRate) || 0 : dailyRate;
        const total = billableDays * rate;
        setTotalPrice(total);
        const prepay = prepaymentType === 'fully_paid' ? total : (typeof prepayment === 'string' ? parseFloat(prepayment) || 0 : prepayment);
        setBalanceDue(total - prepay);
      } else {
        setDuration(t('reservations.form.invalidRange', 'Invalid duration'));
        setTotalPrice(0);
        setBalanceDue(0);
        setReservationState({ 
          label: 'measuring...', 
          color: 'bg-slate-200 text-slate-700', 
          borderColor: '#475569' 
        });
      }
    };
    calculate();
  }, [pickupDate, returnDate, extendedReturnDate, dailyRate, prepayment, verifiedTime, t]);

  useEffect(() => {
    if (prepaymentType === 'fully_paid') {
      setPrepayment('');
    }
  }, [totalPrice, prepaymentType]);

  const validateDates = () => {
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    if (pickupDate && returnDate && end <= start) {
      return t('reservations.form.errors.returnBeforePickup', 'Return date must be after pickup date');
    }
    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setStatus(t('reservationModal.processingFile', 'Processing file...'), 'processing', 0);
    try {
      const base64Data = await fileToBase64(file);
      setPendingFile({ base64Data, fileName: file.name, contentType: file.type });
      setStatus(t('reservationModal.fileReady', 'File ready for upload'), 'success');
    } catch (err) {
      setStatus(t('reservationModal.fileError', 'Error processing file'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUploadList = async (key: keyof typeof docFiles, e: any) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = [...docFiles[key]];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64Data = await fileToBase64(file);
        newFiles.push({ base64Data, name: file.name, contentType: file.type });
      } catch (err) {
        console.error('File conversion error:', err);
      }
    }
    setDocFiles(prev => ({ ...prev, [key]: newFiles }));
  };

  const handleRemoveFile = (key: keyof typeof docFiles, index: number) => {
    const newFiles = [...docFiles[key]];
    newFiles.splice(index, 1);
    setDocFiles(prev => ({ ...prev, [key]: newFiles }));
  };

  const triggerGasSideEffects = async (resData: any) => {
    const resFolderName = `${resData.id}_${new Date().toISOString().split('T')[0]}`.replace(/\s+/g, '_');
    const tasks: Promise<any>[] = [];

    if (pendingFile) {
      tasks.push(
        uploadFile('reservation-files', pendingFile.base64Data, pendingFile.fileName, pendingFile.contentType, resFolderName)
      );
    }

    Object.entries(docFiles).forEach(([key, fileList]) => {
      (fileList as any[]).forEach((fileObj: any) => {
        tasks.push(
          uploadFile('reservation-files', fileObj.base64Data, `${key}_${fileObj.name}`, fileObj.contentType, resFolderName)
        );
      });
    });

    await Promise.allSettled(tasks);
  };

  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);

  const handleRegisterClient = async () => {
    if (!clientName || !clientId || !clientLicense) return;
    
    setIsRegistering(true);
    setRegistrationStatus(null);
    
    try {
      const { data: existingClients, error: checkError } = await supabase
        .from('customers')
        .select('national_id, license_number')
        .or(`national_id.eq.${clientId},license_number.eq.${clientLicense}`);

      if (checkError) throw checkError;

      if (existingClients && existingClients.length > 0) {
        const idExists = existingClients.some(c => c.national_id === clientId);
        const licenseExists = existingClients.some(c => c.license_number === clientLicense);
        
        let msg = "";
        if (idExists && licenseExists) msg = "id card and driving number already exist";
        else if (idExists) msg = "id card already exist";
        else msg = "driving number already exist";
        
        setRegistrationStatus({ type: 'warning', message: msg });
        setIsRegistering(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('customers')
        .insert([{
          name: clientName,
          national_id: clientId,
          license_number: clientLicense,
          phone: clientPhone || '',
          trust_rank: 3,
          is_blacklisted: false
        }]);

      if (insertError) throw insertError;

      setRegistrationStatus({ type: 'success', message: 'client added' });
      const { data: updatedCustomers } = await supabase.from('customers').select('*');
      if (updatedCustomers) setAllCustomers(updatedCustomers);
      
    } catch (err) {
      console.error(err);
      setRegistrationStatus({ type: 'error', message: 'error happened, try again' });
    } finally {
      setIsRegistering(false);
    }
  };

  const isRegisterEnabled = clientName.trim() !== '' && clientId.trim() !== '' && clientLicense.trim() !== '' && !selectedCustomer;

  const handleResetCustomerSection = () => {
    setClientSearchQuery('');
    setClientName('');
    setClientPhone('');
    setClientId('');
    setClientLicense('');
    setSelectedCustomer(null);
    setRegistrationStatus(null);
    setIsClientSearchListActive(false);
  };

  const handleFormSubmit = async (statusOverride?: 'Completed' | 'Confirmed') => {
    const dateError = validateDates();
    if (dateError) { 
      setStatus(dateError, 'error'); // Keep as is - it's a validation message
      return; 
    }

    const newErrors: { [key: string]: string } = {};
    if (!selectedCarId) newErrors.selectedCarId = 'required';
    if (!clientName.trim()) newErrors.clientName = 'required';
    if (!clientId.trim()) newErrors.clientId = 'required';
    if (!clientLicense.trim()) newErrors.clientLicense = 'required';
    if (!pickupDate) newErrors.pickupDate = 'required';
    if (!returnDate) newErrors.returnDate = 'required';
    if (dailyRate === '' || dailyRate === 0) newErrors.dailyRate = 'required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStatus(t('reservationModal.savingReservation', 'Saving reservation...'), 'processing', 0);

    const baseData = {
      car_id: selectedCarId!,
      customer_name: clientName,
      customer_phone: clientPhone,
      start_date: new Date(pickupDate).toISOString(),
      end_date: new Date(returnDate).toISOString(),
      extended_return_date: extendedReturnDate ? new Date(extendedReturnDate).toISOString() : null,
      status: statusOverride || (isEdit ? reservationData.status : 'Confirmed'),
      total_price: totalPrice,
      prepayment: typeof prepayment === 'string' ? parseFloat(prepayment) || 0 : prepayment,
      deposit_type: depositType,
      deposit_amount: typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount,
      fuel_level_out: fuelOut ? parseInt(fuelOut, 10) : undefined,
      fuel_level_in: fuelIn ? parseInt(fuelIn, 10) : undefined,
      odometer_out: odometerOut ? parseInt(odometerOut, 10) : undefined,
      odometer_in: odometerIn ? parseInt(odometerIn, 10) : undefined,
      cleaned_before: cleanedBefore,
      included_items: includedItems,
      notes: notes,
      rating: rating,
    };

    try {
      if (isEdit) {
        const { error } = await updateReservation(reservationData.id, baseData, reservationData.car_id);
        if (error) throw new Error(error);
      } else {
        const { error } = await createReservation(baseData);
        if (error) throw new Error(error);
      }

      if (statusOverride === 'Completed' && selectedCarId) {
        await supabase.from('cars').update({
          status: 'Available',
          odometer: odometerIn ? parseInt(odometerIn, 10) : undefined,
          starting_fuel_level: fuelIn ? parseInt(fuelIn, 10) : undefined
        }).eq('id', selectedCarId);
      }

      await triggerGasSideEffects({
        ...baseData,
        car_brand: carBrand,
        car_model: carModel,
        license_plate: licensePlate
      });

      setStatus(t('reservationModal.reservationSaved', 'Reservation saved successfully'), 'success');
      onClose();
    } catch (err: any) {
      setStatus(`${t('reservationModal.saveError', 'Error saving reservation')}: ${err.message}`, 'error');
    }
  };

  const handleDelete = async () => {
    if (confirm(t('editReservation.deleteConfirm', 'Are you sure you want to delete this reservation?'))) {
      const { error } = await deleteReservation(reservationData.id, reservationData.car_id);
      if (!error) onClose();
    }
  };

  const handleCreateContract = async () => {
    if (!isFormValid) return;
    setIsGeneratingContract(true);
    setStatus(t('reservationModal.generatingContract', 'Generating contract...'), 'processing', 0);
    
    const resData = {
      customer_name: clientName,
      customer_phone: clientPhone,
      customer_id: clientId,
      car_brand: carBrand,
      car_model: carModel,
      license_plate: licensePlate,
      pickup_date: pickupDate,
      return_date: returnDate,
      total_price: totalPrice,
      prepayment: prepayment,
      balance_due: balanceDue,
      deposit_amount: depositAmount,
      deposit_type: depositType
    };

    const filename = `Contract_${clientName.replace(/\s+/g, '_')}_${new Date().getTime()}`;
    setStatus(t('reservationModal.contractNotAvailable', 'Contract generation is not available'), 'error');
    setIsGeneratingContract(false);
  };



  const isFormValid = !!selectedCarId && !!clientName.trim() && !!pickupDate && !!returnDate;

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      disableClose={isSubmitting}
      title={isEdit ? t('editReservation.title', 'Edit Reservation') : t('reservations.form.title', 'New Reservation')}
    >
      <div className="bg-slate-50/50 w-full py-4 sm:py-6 lg:py-8">
        <div className="flex flex-wrap items-start justify-center lg:justify-start gap-8 px-4 sm:px-6 lg:px-8">
          {/* Section 1: Customer */}
          <ModalSection1 
            title={t('reservations.form.customer', 'Customer')}
            extraHeader={
              <button 
                onClick={() => {
                  setIsClientModalOpen(true);
                }}
                className="px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest border-2 border-black rounded-[12px] hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-3 h-3" />
                {t('reservations.form.addNewClient', 'add new client')}
              </button>
            }
          >
          {/* Search Input - Full Width */}
          <div className="flex flex-col relative w-full">
            <Label>{t('reservations.form.searchClient', 'Search Client')}</Label>
            <div className="relative group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-blue-600 transition-colors pointer-events-none z-10" />
                <input 
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setIsClientSearchListActive(e.target.value.length > 0);
                  }}
                  onFocus={() => clientSearchQuery.length > 0 && setIsClientSearchListActive(true)}
                  onBlur={() => setTimeout(() => setIsClientSearchListActive(false), 200)}
                  placeholder={t('reservations.form.searchPlaceholder', 'Type name, ID or license to search...')}
                  className="w-full h-11 bg-white border-2 border-black rounded-[12px] pl-12 pr-12 text-sm font-bold focus:outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out truncate"
                />
              
              {clientSearchQuery && (
                <button 
                  onClick={() => {
                    setClientSearchQuery('');
                    setIsClientSearchListActive(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full text-black/40 hover:text-red-500 transition-all z-20"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}

              <AnimatePresence>
                {isClientSearchListActive && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-[calc(100%+8px)] left-0 w-full z-[100] bg-white border-2 border-black rounded-[12px] shadow-2xl overflow-hidden overflow-y-auto max-h-64"
                  >
                    {allCustomers.filter(c => 
                      c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) || 
                      (c.national_id || '').toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                      (c.license_number || '').toLowerCase().includes(clientSearchQuery.toLowerCase())
                    ).map(customer => (
                      <div 
                        key={customer.id} 
                        className="px-6 py-2 text-sm font-bold border-b border-black/5 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors group" 
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setClientName(customer.name);
                          setClientPhone(customer.phone_number || customer.phone || '');
                          setClientId(customer.national_id || '');
                          setClientLicense(customer.license_number || '');
                          setClientSearchQuery(customer.name);
                          setIsClientSearchListActive(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="text-black group-hover:text-blue-600 transition-colors uppercase text-[13px] leading-tight">{customer.name}</span>
                          <div className="flex items-center gap-4 text-[10px] text-black/40 font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> {customer.national_id || '---'}</span>
                            <span className="flex items-center gap-1.5"><Monitor className="w-3 h-3" /> {customer.license_number || '---'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Customer Fields */}
          {selectedCustomer ? (
            <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-col w-full">
                <Label>{t('reservations.form.fullName', 'Full Name')}</Label>
                <button 
                  onClick={() => setIsClientViewModalOpen(true)}
                  className="w-full h-11 bg-blue-50/50 border-2 border-blue-200 rounded-[12px] px-5 flex items-center gap-3 text-sm font-black text-blue-900 group hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
                >
                  <User className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" />
                  <span className="truncate uppercase">{clientName}</span>
                </button>
              </div>
              <div className="flex flex-col">
                <Label>{t('reservations.form.idCardNumber', 'ID Card Number')}</Label>
                <button 
                  onClick={() => setIsClientViewModalOpen(true)}
                  className="w-full h-11 bg-blue-50/50 border-2 border-blue-200 rounded-[12px] px-5 flex items-center gap-3 text-sm font-black text-blue-900 group hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
                >
                  <CreditCard className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" />
                  <span className="truncate uppercase">{clientId}</span>
                </button>
              </div>
              <div className="flex flex-col">
                <Label>{t('reservations.form.licenseNumber', 'License Number')}</Label>
                <button 
                  onClick={() => setIsClientViewModalOpen(true)}
                  className="w-full h-11 bg-blue-50/50 border-2 border-blue-200 rounded-[12px] px-5 flex items-center gap-3 text-sm font-black text-blue-900 group hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
                >
                  <Monitor className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" />
                  <span className="truncate uppercase">{clientLicense}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full">
              <InputField 
                label={t('reservations.form.fullName', 'Full Name')}
                value={clientName}
                onChange={(e: any) => setClientName(e.target.value)}
                placeholder={t('reservations.form.clientPlaceholder', 'Enter client name...')}
                className={errors.clientName ? 'border-red-500 ring-2 ring-red-100' : ''}
                disabled={isEdit && isEditLocked}
                required
                rightElement={
                  <button 
                    onClick={() => setClientName(clientSearchQuery)}
                    type="button"
                    className="h-11 px-4 bg-slate-50 border-2 border-black rounded-r-[12px] border-l-0 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center group"
                    title="Copy from search"
                  >
                    <ClipboardPaste className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  </button>
                }
              />
              <InputField 
                label={t('reservations.form.idCardNumber', 'ID Card Number')}
                value={clientId}
                onChange={(e: any) => setClientId(e.target.value)}
                placeholder={t('reservations.form.idPlaceholder', 'ID Card...')}
                disabled={isEdit && isEditLocked}
                required
                className={errors.clientId ? 'border-red-500 ring-2 ring-red-100' : ''}
                rightElement={
                  <button 
                    onClick={() => setClientId(clientSearchQuery)}
                    type="button"
                    className="h-11 px-4 bg-slate-50 border-2 border-black rounded-r-[12px] border-l-0 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center group"
                    title="Copy from search"
                  >
                    <ClipboardPaste className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  </button>
                }
              />
              <InputField 
                label={t('reservations.form.licenseNumber', 'License Number')}
                value={clientLicense}
                onChange={(e: any) => setClientLicense(e.target.value)}
                placeholder={t('reservations.form.licensePlaceholder', 'License Num...')}
                disabled={isEdit && isEditLocked}
                required
                className={errors.clientLicense ? 'border-red-500 ring-2 ring-red-100' : ''}
                rightElement={
                  <button 
                    onClick={() => setClientLicense(clientSearchQuery)}
                    type="button"
                    className="h-11 px-4 bg-slate-50 border-2 border-black rounded-r-[12px] border-l-0 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center group"
                    title="Copy from search"
                  >
                    <ClipboardPaste className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  </button>
                }
              />
            </div>
          )}

          <div className="border-t-2 border-black/5 mx-3" />
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                  onClick={handleResetCustomerSection}
                  disabled={isRegistering}
                  className="w-full sm:w-auto sm:min-w-[120px] h-11 px-6 rounded-[12px] text-[10px] font-black uppercase tracking-widest border-2 border-black transition-all shadow-sm flex items-center justify-center gap-2 bg-white text-black hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('common.reset', 'Reset')}
                </button>
                <button
                  onClick={handleRegisterClient}
                  disabled={!isRegisterEnabled || isRegistering}
                  className={`w-full sm:w-auto sm:min-w-[200px] h-11 px-8 rounded-[12px] text-[10px] font-black uppercase tracking-widest border-2 border-black transition-all shadow-sm flex items-center justify-center gap-3 ${
                    !isRegisterEnabled 
                      ? 'bg-slate-100 text-black/20 border-black/10 cursor-not-allowed' 
                      : 'bg-[#0066FF] text-white border-[#0066FF] hover:bg-blue-700 shadow-blue-100 shadow-lg'
                  }`}
                >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.processing', 'Processing...')}
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    {t('reservations.form.registerClientButton', 'Register')}
                  </>
                )}
              </button>
            </div>

            {registrationStatus && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-[12px] border-2 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300 ${
                registrationStatus.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                registrationStatus.type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-700' :
                'bg-red-50 border-red-500 text-red-700'
              }`}>
                {registrationStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {registrationStatus.message}
              </div>
            )}
          </div>
        </ModalSection1>

        {/* Section 2: Schedule */}
        <ModalSection1 title={t('reservations.form.schedule', 'Schedule')}>
          <div className="flex flex-col w-full">
            <Label required>{t('reservations.form.carSelection', 'Car Selection')}</Label>
            <button
              type="button"
              disabled={isEdit && isEditLocked}
              onClick={() => setIsCarSelectorOpen(true)}
              className={`h-11 w-full bg-white border-2 border-black rounded-[12px] px-5 flex items-center justify-between text-sm font-bold group hover:bg-slate-50 transition-all ${errors.selectedCarId ? 'border-red-500 ring-2 ring-red-100' : ''}`}
            >
              <div className="flex items-center gap-3 truncate">
                <CarIcon className="w-4 h-4 text-black/40 group-hover:scale-110 transition-transform" />
                <span className="truncate">{selectedCarId ? availableCars.find(c => c.id === selectedCarId)?.plate + ' - ' + availableCars.find(c => c.id === selectedCarId)?.brand : t('reservations.form.selectCar', 'Select Car')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-black/40" />
            </button>
          </div>

          <InputField 
            label={t('reservations.form.pickupDate', 'Pick-up Date & Time')}
            type="datetime-local"
            value={pickupDate}
            onChange={(e: any) => setPickupDate(e.target.value)}
            className={errors.pickupDate ? 'border-red-500 ring-2 ring-red-100' : ''}
            disabled={isEdit && isEditLocked}
            required
          />

          <div className="flex flex-col gap-1 w-full">
            <InputField 
              label={t('reservations.form.returnDate', 'Return Date & Time')}
              type="datetime-local"
              value={returnDate}
              onChange={(e: any) => setReturnDate(e.target.value)}
              className={errors.returnDate ? 'border-red-500 ring-2 ring-red-100' : ''}
              disabled={isEdit && isEditLocked}
              required
            />
            {validateDates() && returnDate && pickupDate && new Date(returnDate) <= new Date(pickupDate) && (
              <p className="text-[9px] text-red-500 font-black uppercase mt-1 px-2 tracking-widest">{validateDates()}</p>
            )}
          </div>

          <div className="flex flex-col gap-1 w-full">
            <InputField 
              label={t('reservations.form.extendedReturn', 'Extended Return')}
              type="datetime-local"
              value={extendedReturnDate}
              onChange={(e: any) => setExtendedReturnDate(e.target.value)}
              disabled={isEdit && isEditLocked}
            />
            {validateDates() && extendedReturnDate && returnDate && new Date(extendedReturnDate) <= new Date(returnDate) && (
              <p className="text-[9px] text-red-500 font-black uppercase mt-1 px-2 tracking-widest">{validateDates()}</p>
            )}
          </div>

          <div className="flex flex-col w-full">
            <Label>{t('reservations.form.state', 'RESERVATION STATE')}</Label>
            <div className={`h-11 ${reservationState.color} border-2 border-black rounded-[12px] flex items-center justify-center shadow-sm`}>
              <span className="text-[11px] font-black uppercase tracking-widest">
                {reservationState.label}
              </span>
            </div>
          </div>

          <ViewOnlyField 
            label={t('reservations.form.duration', 'Duration')}
            value={duration}
            icon={Calendar}
          />
        </ModalSection1>

        {/* Section 3: Billing */}
        <ModalSection1 title={t('reservations.form.billing', 'Billing')}>
          <InputField 
            label={t('reservations.form.dailyRate', 'Daily Rate')}
            type="number"
            value={dailyRate}
            onChange={(e: any) => setDailyRate(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={isEdit && isEditLocked}
            placeholder="0.00"
            required
            className={errors.dailyRate ? 'border-red-500 ring-2 ring-red-100' : ''}
          />

          <ViewOnlyField 
            label={t('reservations.form.totalPriceCalc', 'Total Price')}
            value={`${totalPrice.toFixed(2)} DH`}
            icon={CreditCard}
          />

          <div className="flex flex-col w-full">
            <Label>{t('reservations.form.prepayment', 'Prepayment')}</Label>
            <div className="flex h-11 border-2 border-black rounded-[12px] bg-white shadow-sm overflow-hidden">
              <div className="relative group shrink-0">
                <select 
                  value={prepaymentType}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setPrepaymentType(val);
                    if (val === 'fully_paid') {
                      setPrepayment('');
                    }
                  }}
                  disabled={isEdit && isEditLocked}
                  className="h-full bg-slate-50 border-r-2 border-black/10 px-4 pr-8 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out appearance-none cursor-pointer hover:bg-slate-100 z-10 relative"
                >
                  <option value="fully_paid">{t('reservations.form.fullyPaid', 'Fully Paid')}</option>
                  <option value="amount">{t('reservations.form.partial', 'Partial')}</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-black/40 pointer-events-none z-20" />
              </div>
              <input 
                type="number"
                value={prepayment}
                onChange={(e: any) => setPrepayment(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={(isEdit && isEditLocked) || prepaymentType === 'fully_paid'}
                placeholder="0.00"
                className="flex-1 px-4 text-sm font-black focus:outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out disabled:bg-slate-50/50 min-w-0"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">
                {balanceDue > 0 ? t('reservations.form.balanceDue', 'Balance Due') + ':' : ''}
              </span>
              <span className={`text-[10px] font-black tracking-widest uppercase ${balanceDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {balanceDue <= 0 ? 'balance due: none' : `${balanceDue.toFixed(2)} DH`}
              </span>
            </div>
          </div>

          <SelectField 
            label={t('reservations.form.depositType', 'Deposit Type')}
            value={depositType}
            onChange={(e: any) => {
              const val = e.target.value;
              setDepositType(val);
              if (val === "" || val === "None") {
                setDepositAmount('');
              }
            }}
            disabled={isEdit && isEditLocked}
          >
            <option value="">{t('common.select', 'Select')}</option>
            <option value="None">{t('common.none', 'None')}</option>
            <option value="Cash">{t('reservations.form.cash', 'Cash')}</option>
            <option value="Cheque">{t('reservations.form.cheque', 'Cheque')}</option>
          </SelectField>

          <InputField 
            label={t('reservations.form.depositAmount', 'Deposit Amount')}
            type="number"
            value={depositAmount}
            onChange={(e: any) => setDepositAmount(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={(isEdit && isEditLocked) || depositType === 'None' || depositType === ''}
            placeholder="0.00"
          />
        </ModalSection1>

        {/* Section 4: Documentation */}
        <ModalSection1 
          title={t('reservations.form.documentation', 'Documentation')}
          extraHeader={
            <button 
              onClick={handleCreateContract}
              disabled={isGeneratingContract || (isEdit && isEditLocked)}
              className="px-3 sm:px-4 py-1.5 bg-blue-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest border-2 border-black rounded-[12px] hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shrink-0"
              type="button"
            >
              {isGeneratingContract ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-white/60" />}
              <span className="hidden xs:inline">{t('reservations.form.generateContractPdf', 'Contract PDF')}</span>
              <span className="xs:hidden">PDF</span>
            </button>
          }
        >
          <div className="col-span-full flex flex-col gap-10">
            {generatedContractFile && (
              <button
                type="button"
                onClick={() => {
                  if (generatedContractFile.url) {
                    window.open(generatedContractFile.url, '_blank');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border-2 border-emerald-500/20 rounded-[12px] w-fit animate-in fade-in slide-in-from-top-2 hover:bg-emerald-100 hover:border-emerald-500/40 transition-all cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-900">{generatedContractFile.name}</span>
                <FileText className="w-3 h-3 text-emerald-600" />
              </button>
            )}

            <div className="grid grid-cols-1 gap-8 w-full">
              <MultiFileUpload 
                label={t('reservations.form.vehicleState', 'Vehicle State (Before/After)')}
                files={docFiles.vehicle_state}
                onUpload={(e: any) => handleFileUploadList('vehicle_state', e)}
                onRemove={(idx: number) => handleRemoveFile('vehicle_state', idx)}
                disabled={isEdit && isEditLocked}
              />
              <MultiFileUpload 
                label={t('reservations.form.paperContract', 'Paper Contract PDF')}
                files={docFiles.paper_contract}
                onUpload={(e: any) => handleFileUploadList('paper_contract', e)}
                onRemove={(idx: number) => handleRemoveFile('paper_contract', idx)}
                disabled={isEdit && isEditLocked}
              />
            </div>
          </div>
        </ModalSection1>

          {/* Section 5: Vehicle Inspection */}
          <ModalSection1 title={t('reservations.form.vehicleInspection', 'Vehicle Inspection')}>
            <InputField 
              label="Starting KM"
              type="number"
              value={odometerOut}
              onChange={(e: any) => setOdometerOut(e.target.value)}
              placeholder="KM"
              disabled={isEdit && isEditLocked}
            />

            <InputField 
              label="Arrival KM"
              type="number"
              value={odometerIn}
              onChange={(e: any) => setOdometerIn(e.target.value)}
              placeholder="KM"
              disabled={isEdit && isEditLocked}
            />

            <InputField 
              label="Starting Fuel"
              type="number"
              value={fuelOut}
              onChange={(e: any) => setFuelOut(e.target.value)}
              placeholder="%"
              disabled={isEdit && isEditLocked}
            />

            <InputField 
              label="Arrival Fuel"
              type="number"
              value={fuelIn}
              onChange={(e: any) => setFuelIn(e.target.value)}
              placeholder="%"
              disabled={isEdit && isEditLocked}
            />

            <SelectField 
              label={t('reservations.form.cleaningState', 'pick-up clean state')}
              value={cleanedBefore}
              onChange={(e: any) => setCleanedBefore(e.target.value)}
              disabled={isEdit && isEditLocked}
            >
              <option value="">{t('common.select', 'Select')}</option>
              <option value="yes">{t('common.yes', 'Yes')}</option>
              <option value="no">{t('common.no', 'No')}</option>
            </SelectField>

            <div className="col-span-full flex flex-col gap-8 mt-2 w-full">
              <ItemSection 
                items={includedItems}
                onChange={setIncludedItems}
                isEdit={isEdit}
                isEditLocked={isEditLocked}
              />

              <div className="w-full border-t border-black/5 pt-6">
                <TextareaField 
                  label={t('reservations.form.notes', 'Notes')}
                  value={notes}
                  onChange={(e: any) => setNotes(e.target.value)}
                  placeholder={t('reservations.form.notesPlaceholder', 'Add any additional information...')}
                  disabled={isEdit && isEditLocked}
                  className="w-full"
                />
              </div>
            </div>
          </ModalSection1>
        </div>
      </div>

        {/* Modal Overlays */}
        <AnimatePresence>
          {isClientModalOpen && (
            <ClientModal 
              isOpen={isClientModalOpen}
              onClose={() => setIsClientModalOpen(false)}
              mode="add"
              onRefresh={async () => {
                const { data } = await supabase.from('customers').select('*');
                if (data) setAllCustomers(data);
              }}
              onConfirm={() => setIsClientModalOpen(false)}
            />
          )}

          {isCarSelectorOpen && (
            <BaseModal
              isOpen={isCarSelectorOpen}
              onClose={() => setIsCarSelectorOpen(false)}
              title={t('reservations.form.selectCar', 'Select Car')}
              maxWidth="max-w-5xl"
            >
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {availableCars.map(car => (
                    <div
                      key={car.id}
                      onClick={() => {
                        setSelectedCarId(car.id);
                        setCarBrand(car.brand);
                        setCarModel(car.model);
                        setLicensePlate(car.plate);
                        setDailyRate(car.daily_rate);
                        setOdometerOut(car.odometer?.toString() || '0');
                        setFuelOut('');
                        // Pre-select items from car essentials
                        if (car.essentials) {
                          setIncludedItems(car.essentials.filter((e: any) => e.checked).map((e: any) => e.name));
                        } else {
                          setIncludedItems([]);
                        }
                        setIsCarSelectorOpen(false);
                      }}
                      className={`group flex flex-col p-3 cursor-pointer transition-all duration-200 border-2 border-black rounded-[12px] bg-white relative ${
                        selectedCarId === car.id 
                          ? 'shadow-[0px_0px_0px_1px_rgba(0,0,0,1),0px_0px_0px_4px_rgba(59,130,246,0.1),-3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5 translate-x-0.5 bg-blue-50/50' 
                          : 'shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[-3px_3px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      {/* Car Image Placeholder Container */}
                      <div className="w-full aspect-[4/3] bg-slate-50 border border-black/5 rounded-[12px] mb-3 overflow-hidden flex items-center justify-center p-2">
                        {car.image_url ? (
                          <img 
                            alt={car.model}
                            className="w-full h-full object-contain mix-blend-multiply" 
                            src={getDriveImageUrl(car.image_url)}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full opacity-5 flex items-center justify-center" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 12px, transparent 12px, transparent 24px)' }}>
                            <CarIcon className="w-10 h-10 text-black" />
                          </div>
                        )}
                      </div>

                      {/* Info Section */}
                      <div className="flex flex-col gap-0.5">
                        <h3 className="text-[13px] font-black text-black uppercase leading-tight tracking-tight truncate">
                          {car.brand} {car.model}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">
                          {car.plate}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter border border-black/10 rounded-[12px] transition-transform group-hover:scale-105 ${
                            car.status === 'Available' ? 'bg-[#22C55E] text-white' : 'bg-[#F59E0B] text-white'
                          }`}>
                            {car.status}
                          </span>
                          <div className="text-[12px] font-black text-black whitespace-nowrap">
                            {car.daily_rate} <span className="text-[9px] font-bold opacity-30">DH/D</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </BaseModal>
          )}

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
                    {t('tools.imageToPdf', 'Image to PDF')}
                  </h3>
                </div>

                <ImageToPdf onAssign={handlePdfToolAssign} />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Updated Footer to match CarModal - Enhanced Responsiveness */}
        <div className="px-6 py-6 sm:px-10 bg-slate-50 border-t-2 border-black/10 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 sm:gap-8 w-full sm:w-auto px-5 py-3 border-l-4 border-blue-600 bg-white shadow-sm rounded-r-[12px]">
              <div>
                <p className="text-[9px] font-black text-black/40 uppercase tracking-[0.2em]">{t('reservations.form.totalPriceCalc', 'Total Price')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-black">{totalPrice.toFixed(2)}</span>
                  <span className="text-[10px] font-bold text-black/40">DH</span>
                </div>
              </div>
              <div className="h-8 w-px bg-black/10 mx-2 hidden sm:block"></div>
              <div>
                <p className="text-[9px] font-black text-black/40 uppercase tracking-[0.2em] text-blue-600">{t('reservations.form.balanceDue', 'Balance Due')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-blue-600">{balanceDue.toFixed(2)}</span>
                  <span className="text-[10px] font-bold text-blue-600/40">DH</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              <button 
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none sm:w-32 h-11 bg-white border-2 border-black/20 rounded-[12px] text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.cancel', 'Cancel')}
              </button>

              {isEdit && (
                <button 
                  onClick={handleDelete}
                  className="flex-1 sm:flex-none sm:w-32 h-11 bg-red-50 text-red-600 border-2 border-red-200 rounded-[12px] text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t('common.delete', 'Delete')}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:justify-end items-center gap-3">
            {!isEdit && (
              <button 
                disabled={!isFormValid || isSubmitting}
                onClick={() => handleFormSubmit('Completed')}
                className="w-full sm:w-48 h-12 bg-slate-800 text-white border-2 border-black rounded-[12px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-sm disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> {t('reservations.form.archive', 'Archive')}
              </button>
            )}

            {isEdit && reservationData?.status !== 'Completed' && (
              <button 
                onClick={() => handleFormSubmit('Completed')}
                className="w-full sm:w-48 h-12 bg-slate-800 text-white border-2 border-black rounded-[12px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-sm"
              >
                <CheckCircle className="w-4 h-4" /> {t('reservations.form.archive', 'Archive')}
              </button>
            )}

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isEdit && (
                <button 
                  onClick={() => setIsEditLocked(!isEditLocked)}
                  className={`w-12 h-12 flex items-center justify-center rounded-[12px] border-2 border-black transition-all shadow-sm ${isEditLocked ? 'bg-primary text-white' : 'bg-slate-200 text-black'}`}
                  title={isEditLocked ? t('editReservation.edit', 'Edit') : t('editReservation.lock', 'Lock')}
                >
                  {isEditLocked ? <Edit className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </button>
              )}

              <button 
                disabled={!isFormValid || isSubmitting || (isEdit && isEditLocked)}
                onClick={() => handleFormSubmit()}
                className="flex-1 sm:w-56 h-12 bg-blue-600 text-white border-2 border-blue-600 rounded-[12px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-30"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isSubmitting ? t('common.saving', 'Saving...') : (isEdit ? t('common.save', 'Save Changes') : t('common.confirm', 'Confirm'))}
              </button>
            </div>
          </div>
        </div>

        <ClientModal 
          isOpen={isClientViewModalOpen}
          onClose={() => setIsClientViewModalOpen(false)}
          mode="edit"
          client={selectedCustomer}
          onConfirm={() => setIsClientViewModalOpen(false)}
        />
    </BaseModal>
  );
}
