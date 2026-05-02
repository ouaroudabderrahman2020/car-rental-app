import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, User, Phone, CreditCard, 
  Car as CarIcon, Calendar, Monitor, ClipboardList, 
  Upload, Star, Plus, Check, Loader2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { gasService } from '../services/gasService';
import { useReservations } from '../hooks/useReservations';
import { useVerifiedTime } from '../hooks/useVerifiedTime';
import { useStatus } from '../contexts/StatusContext';

import Button1 from './Button1';
import Field1 from './Field1';
import FormSection from './FormSection';
import ReservationForm from './ReservationForm';

interface AddReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddReservationModal({ isOpen, onClose }: AddReservationModalProps) {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
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
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Initial items translation
  useEffect(() => {
    if (isOpen && includedItems.length === 0) {
      setIncludedItems([
        t('reservations.form.includedItemsList.vest'),
        t('reservations.form.includedItemsList.triangle'),
        t('reservations.form.includedItemsList.extinguisher'),
        t('reservations.form.includedItemsList.tire'),
        t('reservations.form.includedItemsList.jack'),
        t('reservations.form.includedItemsList.wrench')
      ]);
    }
  }, [isOpen, t]);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);

  // UI State
  const { createReservation, loading: isSubmitting } = useReservations();
  const { verifiedTime } = useVerifiedTime();
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [clientListActive, setClientListActive] = useState(false);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Removed auto-fill for pickupDate to ensure modal starts empty

  const validateDates = () => {
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const ext = extendedReturnDate ? new Date(extendedReturnDate) : null;

    if (pickupDate && returnDate) {
      if (end <= start) {
        return t('reservations.form.errors.returnBeforePickup', 'Return Date must be later than Pick-up Date');
      }
    }
    if (returnDate && ext) {
      if (ext <= end) {
        return t('reservations.form.errors.extBeforeReturn', 'Extended Return must be later than Return Date');
      }
    }
    return null;
  };

  const validatePhone = (phone: string) => /^\+?[0-9\s-]{8,20}$/.test(phone);
  const validateId = (id: string) => /^[a-zA-Z0-9-]{5,30}$/.test(id);

  // Calculations
  const [duration, setDuration] = useState('0 Days, 0 Hours');
  const [totalPrice, setTotalPrice] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  const [reservationState, setReservationState] = useState({ 
    label: 'N/A', 
    color: 'bg-slate-200 text-slate-700', 
    borderColor: '#475569' 
  });

  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const calculate = () => {
      const now = verifiedTime;
      const start = new Date(pickupDate);
      const standardEnd = new Date(returnDate);
      const extEnd = extendedReturnDate ? new Date(extendedReturnDate) : null;
      const end = (extEnd && !isNaN(extEnd.getTime())) ? extEnd : standardEnd;

      // State Calculation
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
      } else {
        setReservationState({ 
          label: 'N/A', 
          color: 'bg-slate-200 text-slate-700', 
          borderColor: '#475569' 
        });
      }

      // Price and Duration
      if (start.getTime() && end.getTime() && end > start) {
        const diffMs = end.getTime() - start.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);
        const d = Math.floor(totalHours / 24);
        const h = Math.floor(totalHours % 24);
        setDuration(`${d} ${t('reservations.form.days')}, ${h} ${t('reservations.form.hours')}`);

        const billableDays = Math.ceil(totalHours / 24);
        const rate = typeof dailyRate === 'string' ? parseFloat(dailyRate) || 0 : dailyRate;
        const total = billableDays * rate;
        setTotalPrice(total);
        const prepay = typeof prepayment === 'string' ? parseFloat(prepayment) || 0 : prepayment;
        setBalanceDue(total - prepay);
      } else {
        setDuration(t('reservations.form.invalidRange'));
        setTotalPrice(0);
        setBalanceDue(0);
      }
    };

    calculate();
  }, [pickupDate, returnDate, extendedReturnDate, dailyRate, prepayment]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchCars = async () => {
      const { data } = await supabase
        .from('cars')
        .select('id, brand, model, plate, daily_rate, odometer, starting_fuel_level, status')
        .neq('status', 'Decommissioned'); 
      
      if (data) setAvailableCars(data);
    };

    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('customers')
        .select('*');
      if (data) setAllCustomers(data);
    };

    if (isOpen) {
      fetchCars();
      fetchCustomers();
    }
  }, [isOpen]);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      setIncludedItems([...includedItems, newItemName.trim()]);
      setNewItemName('');
    }
    setIsAddingItem(false);
  };

  const isFormValid = selectedCarId !== null && clientName.trim() !== '' && pickupDate !== '' && returnDate !== '';

  const handleCreateContract = async () => {
    if (!isFormValid) return;
    setIsGeneratingContract(true);
    setStatus(t('reservations.form.generating', 'Generating contract...'), 'processing', 0);
    
    // Prepare reservation data for template
    const reservationData = {
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
    const result = await gasService.generateContract(filename, reservationData);

    if (result.success) {
      setStatus(t('common.success'), 'success');
      alert(t('reservations.form.contractSuccess', 'Contract generated successfully in Drive!'));
    } else {
      setStatus(t('common.error'), 'error');
      alert(`${t('common.error')}: ${result.error}`);
    }
    setIsGeneratingContract(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus(t('reservations.form.processingFile'), 'processing', 0);
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setPendingFile({
        base64Data,
        fileName: file.name,
        contentType: file.type
      });
      setUploadedDocUrl(file.name);
      setStatus(t('reservations.form.fileReady'), 'success');
      setIsUploading(false);
    };
    reader.onerror = () => {
      setStatus(t('common.error'), 'error');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerGasSideEffects = async (resData: any) => {
    setStatus(t('common.syncingExternal'), 'processing', 30);
    
    const tasks = [];
    
    // 1. Export to Sheets
    const rows = [[
      resData.customer_name,
      resData.customer_phone,
      resData.car_brand,
      resData.car_model,
      resData.license_plate,
      resData.start_date,
      resData.end_date,
      resData.total_price,
      resData.status
    ]];
    tasks.push(gasService.exportData('Reservations', rows));

    
    // 2. Upload Pending File
    if (pendingFile) {
      tasks.push(gasService.uploadBase64(pendingFile));
    }
    
    // 3. Generate Contract
    const filename = `Contract_${resData.customer_name.replace(/\s+/g, '_')}_${new Date().getTime()}`;
    tasks.push(gasService.generateContract(filename, resData));

    
    try {
      await Promise.allSettled(tasks);
      return true;
    } catch (e) {
      console.error('GAS Side Effects failed', e);
      return false;
    }
  };

  const handleConfirm = async () => {
    // Check validation first
    const dateError = validateDates();
    if (dateError) {
      alert(dateError);
      return;
    }
    
    // Strict Validation for missing required fields
    const newErrors: { [key: string]: string } = {};
    if (!selectedCarId) newErrors.selectedCarId = 'required';
    if (!clientName.trim()) newErrors.clientName = 'required';
    if (!pickupDate) newErrors.pickupDate = 'required';
    if (!returnDate) newErrors.returnDate = 'required';
    
    if (clientPhone && !validatePhone(clientPhone)) newErrors.phone = t('reservations.form.errors.invalidPhone');
    if (clientId && !validateId(clientId)) newErrors.id = t('reservations.form.errors.invalidId');
    if (clientLicense && !validateId(clientLicense)) newErrors.license = t('reservations.form.errors.invalidLicense');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStatus(t('common.processingSubmission', 'Processing submission...'), 'processing', 10);

    const reservationData = {
      car_id: selectedCarId!,
      customer_name: clientName,
      customer_phone: clientPhone,
      start_date: new Date(pickupDate).toISOString(),
      end_date: new Date(returnDate).toISOString(),
      extended_return_date: extendedReturnDate ? new Date(extendedReturnDate).toISOString() : null,
      status: 'Confirmed' as const,
      total_price: totalPrice,
      prepayment: typeof prepayment === 'string' ? parseFloat(prepayment) || 0 : prepayment,
      deposit_type: depositType,
      deposit_amount: typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount,
      fuel_level_out: parseInt(fuelOut) || null,
      odometer_out: parseInt(odometerOut) || null,
      cleaned_before: cleanedBefore,
      included_items: includedItems,
      notes: notes,
      rating: rating,
    };

    try {
      // 1. Sync to Supabase
      const { error } = await createReservation(reservationData);
      if (error) throw new Error(error);

      // 2. Trigger GAS Side Effects simultaneously
      await triggerGasSideEffects({
        ...reservationData,
        car_brand: carBrand,
        car_model: carModel,
        license_plate: licensePlate
      });

      setStatus(t('common.success'), 'success');
      onClose();
    } catch (error: any) {
      console.error('Error during submission:', error);
      setStatus(t('common.error'), 'error');
      alert(`${t('common.error')}: ${error.message}`);
    }
  };

  const handleArchive = async () => {
    if (!isFormValid) return;
    setStatus(t('common.processingSubmission', 'Processing submission...'), 'processing', 10);
    
    const reservationData = {
      car_id: selectedCarId!,
      customer_name: clientName,
      customer_phone: clientPhone,
      start_date: new Date(pickupDate).toISOString(),
      end_date: new Date(returnDate).toISOString(),
      extended_return_date: extendedReturnDate ? new Date(extendedReturnDate).toISOString() : null,
      status: 'Completed' as const,
      total_price: totalPrice,
      prepayment: typeof prepayment === 'string' ? parseFloat(prepayment) || 0 : prepayment,
      deposit_type: depositType,
      deposit_amount: typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount,
      fuel_level_out: parseInt(fuelOut) || null,
      odometer_out: parseInt(odometerOut) || null,
      cleaned_before: cleanedBefore,
      included_items: includedItems,
      notes: notes,
      rating: rating,
    };

    try {
      // 1. Sync to Supabase
      const { error } = await createReservation(reservationData);
      if (error) throw new Error(error);

      // 2. Trigger GAS Side Effects simultaneously
      await triggerGasSideEffects({
        ...reservationData,
        car_brand: carBrand,
        car_model: carModel,
        license_plate: licensePlate
      });

      setStatus(t('common.success'), 'success');
      onClose();
    } catch (error: any) {
      setStatus(t('common.error'), 'error');
      alert(`Error archiving: ${error.message}`);
    }
  };

  const handleAddNewClient = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: clientName,
          phone: clientPhone,
          id_card_number: clientId,
          license_number: clientLicense,
          trust_rank: rating || 3
        }])
        .select();
      
      if (error) throw error;
      if (data) {
        setAllCustomers([...allCustomers, data[0]]);
        setIsAddingNewClient(false);
        alert(t('common.clientAdded', 'New client profile created'));
      }
    } catch (error: any) {
      alert(`Error creating client: ${error.message}`);
    }
  };

  const isClientModified = clientName.trim() !== '' && !allCustomers.some(c => c.name === clientName);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-10 overflow-y-auto no-scrollbar">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl industrial-shadow flex flex-col relative my-auto max-h-[95vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 bg-midnight-ink flex justify-between items-center shrink-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">{t('reservations.form.title')}</h2>
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-white w-full">
          <ReservationForm 
            t={t}
            availableCars={availableCars}
            selectedCarId={selectedCarId}
            setSelectedCarId={setSelectedCarId}
            setCarBrand={setCarBrand}
            setCarModel={setCarModel}
            setLicensePlate={setLicensePlate}
            setDailyRate={setDailyRate}
            setOdometerOut={setOdometerOut}
            setFuelOut={setFuelOut}
            pickupDate={pickupDate}
            setPickupDate={setPickupDate}
            returnDate={returnDate}
            setReturnDate={setReturnDate}
            extendedReturnDate={extendedReturnDate}
            setExtendedReturnDate={setExtendedReturnDate}
            validateDates={validateDates}
            reservationState={reservationState}
            duration={duration}
            dailyRate={dailyRate}
            totalPrice={totalPrice}
            clientName={clientName}
            setClientName={setClientName}
            setClientListActive={setClientListActive}
            clientListActive={clientListActive}
            allCustomers={allCustomers}
            isClientModified={isClientModified}
            handleAddNewClient={handleAddNewClient}
            clientPhone={clientPhone}
            setClientPhone={setClientPhone}
            clientId={clientId}
            setClientId={setClientId}
            clientLicense={clientLicense}
            setClientLicense={setClientLicense}
            errors={errors}
            rating={rating}
            setRating={setRating}
            notes={notes}
            setNotes={setNotes}
            notesRef={notesRef}
            prepayment={prepayment}
            setPrepayment={setPrepayment}
            balanceDue={balanceDue}
            depositType={depositType}
            setDepositType={setDepositType}
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            odometerOut={odometerOut}
            odometerIn={odometerIn}
            setOdometerIn={setOdometerIn}
            fuelOut={fuelOut}
            fuelIn={fuelIn}
            setFuelIn={setFuelIn}
            cleanedBefore={cleanedBefore}
            setCleanedBefore={setCleanedBefore}
            isAddingItem={isAddingItem}
            setIsAddingItem={setIsAddingItem}
            newItemName={newItemName}
            setNewItemName={setNewItemName}
            handleAddItem={handleAddItem}
            includedItems={includedItems}
            handleFileUpload={handleFileUpload}
            handleCreateContract={handleCreateContract}
            isUploading={isUploading}
            isGeneratingContract={isGeneratingContract}
          />

          {/* Footer Card */}
          <div className="px-6 py-8 sm:px-10 bg-slate-50 flex flex-col gap-8 shrink-0 border-t border-black">
            <div className="flex flex-wrap gap-x-12 gap-y-6 items-center text-ink border-s-4 border-primary ps-8 py-2">
              <div>
                <p className="text-[10px] font-bold text-ink/60 uppercase tracking-[0.2em]">{t('reservations.form.totalPriceCalc')}</p>
                <p className="text-2xl sm:text-3xl font-black">{totalPrice.toFixed(2)} USD</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink/60 uppercase tracking-[0.2em]">{t('reservations.form.balanceDue')}</p>
                <p className="text-2xl sm:text-3xl font-black text-primary">{balanceDue.toFixed(2)} USD</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button1 
                disabled={!isFormValid || isSubmitting}
                onClick={handleArchive}
                className="sm:flex-1"
              >
                {t('reservations.form.archive')}
              </Button1>
              <Button1 
                onClick={onClose}
                className="sm:flex-1 !bg-slate-500 !border-slate-500 hover:!bg-slate-600 hover:!border-slate-600"
              >
                {t('common.cancel')}
              </Button1>
              <Button1 
                disabled={!isFormValid || isSubmitting}
                onClick={handleConfirm}
                className="sm:flex-[1.5] !bg-primary !border-primary hover:!bg-primary/90 hover:!border-primary/90"
                icon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              >
                {isSubmitting ? t('reservations.form.recording') : t('common.confirm', 'Confirm')}
              </Button1>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
