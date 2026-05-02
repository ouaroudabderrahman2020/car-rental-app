import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, User, Phone, CreditCard, 
  Car as CarIcon, Calendar, Monitor, ClipboardList, 
  Upload, Star, Plus, Check, Edit, Lock, Trash2, CheckCircle, Loader2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { gasService } from '../services/gasService';
import { useReservations } from '../hooks/useReservations';
import { useVerifiedTime } from '../hooks/useVerifiedTime';
import { useStatus } from '../contexts/StatusContext';
import { Reservation, Car as CarType } from '../types';

import FormSection from './FormSection';
import Button1 from './Button1';
import ReservationForm from './ReservationForm';

interface EditReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationData: any; // Using any for the expanded data passed from Reservations list
}

export default function EditReservationModal({ isOpen, onClose, reservationData }: EditReservationModalProps) {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State (initialized from reservationData if provided)
  const [carBrand, setCarBrand] = useState(reservationData?.carBrand || '');
  const [carModel, setCarModel] = useState(reservationData?.car || '');
  const [licensePlate, setLicensePlate] = useState(reservationData?.plate || 'PLATE-01');
  const [pickupDate, setPickupDate] = useState(reservationData?.pickupDate || '2023-10-12T10:00');
  const [returnDate, setReturnDate] = useState(reservationData?.returnDate || '2023-10-15T10:00');
  const [extendedReturnDate, setExtendedReturnDate] = useState(reservationData?.extendedReturnDate || '');
  const [dailyRate, setDailyRate] = useState(reservationData?.rate || 150);
  const [clientName, setClientName] = useState(reservationData?.client || '');
  const [clientPhone, setClientPhone] = useState(reservationData?.phone || '+1 555-0123-456');
  const [clientId, setClientId] = useState(reservationData?.clientId || 'ID-99388271');
  const [clientLicense, setClientLicense] = useState(reservationData?.license || 'DL-A552-8819');
  const [prepayment, setPrepayment] = useState(reservationData?.prepayment || 100);
  const [depositType, setDepositType] = useState(reservationData?.depositType || 'Cash');
  const [depositAmount, setDepositAmount] = useState(reservationData?.depositAmount || 0);
  const [odometerOut, setOdometerOut] = useState(reservationData?.odometerOut || '');
  const [odometerIn, setOdometerIn] = useState(reservationData?.odometerIn || '');
  const [fuelOut, setFuelOut] = useState(reservationData?.fuelOut || '');
  const [fuelIn, setFuelIn] = useState(reservationData?.fuelIn || '');
  const [cleanedBefore, setCleanedBefore] = useState(reservationData?.cleanedBefore || 'yes');
  const [includedItems, setIncludedItems] = useState(reservationData?.includedItems || [
    'Safety Vest', 'Warning Triangle', 'Fire Extinguisher',
    'Spare Tire', 'Lifting Jack', 'Lug Wrench'
  ]);
  const [notes, setNotes] = useState(reservationData?.notes || '');
  const [rating, setRating] = useState(reservationData?.rating || 0);

  // UI State
  const { updateReservation, deleteReservation, loading: isSubmitting } = useReservations();
  const { verifiedTime } = useVerifiedTime();
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [availableCars, setAvailableCars] = useState<CarType[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(reservationData?.car_id || null);
  const [carListActive, setCarListActive] = useState(false);
  const [clientListActive, setClientListActive] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateDates = () => {
    if (pickupDate && returnDate) {
      if (new Date(returnDate) <= new Date(pickupDate)) {
        return t('addReservation.errors.dateRange');
      }
      // If updating, we allows past pickup but generally warn if trying to set new future pickup to past
      if (isEditMode && new Date(pickupDate) < new Date(verifiedTime.getTime() - 600000)) {
        // Just a sanity check: if they move the pickup to 10 mins ago, it's fine for "active" edits
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
    label: 'ACTIVE', 
    color: 'text-primary', 
    borderColor: 'border-primary' 
  });

  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (reservationData) {
      setCarBrand(reservationData.carBrand || reservationData.car?.brand || '');
      setCarModel(reservationData.carName?.split(' ')[1] || reservationData.car?.model || '');
      setClientName(reservationData.client || reservationData.customer_name || '');
      setLicensePlate(reservationData.carPlate || reservationData.car?.plate || '');
      setPickupDate(reservationData.start_date?.slice(0, 16) || reservationData.pickupDate || '');
      setReturnDate(reservationData.end_date?.slice(0, 16) || reservationData.returnDate || '');
      setExtendedReturnDate(reservationData.extended_return_date?.slice(0, 16) || '');
      setDailyRate(reservationData.daily_rate || reservationData.car?.daily_rate || 0);
      setClientPhone(reservationData.customer_phone || '');
      setPrepayment(reservationData.prepayment || 0);
      setTotalPrice(reservationData.total_price || 0);
      setSelectedCarId(reservationData.car_id || null);
      setOdometerOut(reservationData.odometer_out?.toString() || '');
      setOdometerIn(reservationData.odometer_in?.toString() || '');
      setFuelOut(reservationData.fuel_level_out?.toString() || '');
      setFuelIn(reservationData.fuel_level_in?.toString() || '');
      setDepositType(reservationData.deposit_type || '');
      setDepositAmount(reservationData.deposit_amount || 0);
      setCleanedBefore(reservationData.cleaned_before || 'yes');
      setIncludedItems(reservationData.included_items || []);
      setNotes(reservationData.notes || '');
      setRating(reservationData.rating || 0);
      setClientId(reservationData.customer_id || '');
    }
  }, [reservationData]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cars }, { data: customers }] = await Promise.all([
        supabase
          .from('cars')
          .select('*')
          .neq('status', 'Decommissioned'),
        supabase
          .from('customers')
          .select('*')
      ]);
      
      if (cars) setAvailableCars(cars as CarType[]);
      if (customers) setAllCustomers(customers);
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    const calculate = () => {
      const now = verifiedTime;
      const start = new Date(pickupDate);
      const standardEnd = new Date(returnDate);
      const extEnd = extendedReturnDate ? new Date(extendedReturnDate) : null;
      const end = (extEnd && !isNaN(extEnd.getTime())) ? extEnd : standardEnd;

      // State Calculation
      if (start.getTime() && end.getTime()) {
        if (start > now) {
          setReservationState({ 
            label: 'Reserved', 
            color: 'text-amber-600', 
            borderColor: 'border-amber-400' 
          });
        } else if (now > end) {
          setReservationState({ 
            label: 'Overdue', 
            color: 'text-red-600', 
            borderColor: 'border-red-500' 
          });
        } else {
          setReservationState({ 
            label: 'Active', 
            color: 'text-primary', 
            borderColor: 'border-primary' 
          });
        }
      }

      // Price and Duration
      if (start.getTime() && end.getTime() && end > start) {
        const diffMs = end.getTime() - start.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);
        const d = Math.floor(totalHours / 24);
        const h = Math.floor(totalHours % 24);
        setDuration(`${d} ${t('addReservation.days')}, ${h} ${t('addReservation.hours')}`);

        const billableDays = Math.ceil(totalHours / 24);
        const total = billableDays * dailyRate;
        setTotalPrice(total);
        setBalanceDue(total - prepayment);
      } else {
        setDuration('Invalid Range');
        setTotalPrice(0);
        setBalanceDue(0);
      }
    };

    calculate();
  }, [pickupDate, returnDate, extendedReturnDate, dailyRate, prepayment]);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      setIncludedItems([...includedItems, newItemName.trim()]);
      setNewItemName('');
    }
    setIsAddingItem(false);
  };

  const isFormValid = clientName.trim() !== '' && pickupDate !== '' && returnDate !== '';

  const handleCreateContract = async () => {
    if (!isFormValid) return;
    setIsGeneratingContract(true);
    
    // Prepare reservation data for template
    const reservationDataToGAS = {
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
    const result = await gasService.generateContract(filename, reservationDataToGAS);

    if (result.success) {
      alert(t('reservations.form.contractSuccess', 'Contract generated successfully in Drive!'));
    } else {
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
    
    if (clientPhone && !validatePhone(clientPhone)) newErrors.phone = t('addReservation.errors.invalidPhone');
    if (clientId && !validateId(clientId)) newErrors.id = t('addReservation.errors.invalidId');
    if (clientLicense && !validateId(clientLicense)) newErrors.license = t('addReservation.errors.invalidLicense');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStatus(t('common.processingSubmission', 'Processing submission...'), 'processing', 10);
    
    const reservationUpdateData = {
      customer_name: clientName,
      customer_phone: clientPhone,
      start_date: new Date(pickupDate).toISOString(),
      end_date: new Date(returnDate).toISOString(),
      extended_return_date: extendedReturnDate ? new Date(extendedReturnDate).toISOString() : null,
      total_price: totalPrice,
      prepayment: typeof prepayment === 'string' ? parseFloat(prepayment) || 0 : prepayment,
      deposit_type: depositType,
      deposit_amount: typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount,
      car_id: selectedCarId!,
      fuel_level_out: parseInt(fuelOut) || null,
      odometer_out: parseInt(odometerOut) || null,
      cleaned_before: cleanedBefore,
      included_items: includedItems,
      notes: notes,
      rating: rating,
    };

    try {
      // 1. Sync to Supabase
      const { error } = await updateReservation(
        reservationData.id,
        reservationUpdateData,
        reservationData.car_id
      );

      if (error) throw new Error(error);

      // 2. Trigger GAS Side Effects simultaneously
      await triggerGasSideEffects({
        ...reservationUpdateData,
        car_brand: carBrand,
        car_model: carModel,
        license_plate: licensePlate
      });

      setStatus(t('common.success'), 'success');
      setIsEditMode(false);
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      setStatus(t('common.error'), 'error');
      alert(`Failed to save changes: ${error.message}`);
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
        alert(t('common.clientAdded', 'New client profile created'));
      }
    } catch (error: any) {
      alert(`Error creating client: ${error.message}`);
    }
  };

  const isClientModified = isEditMode && clientName.trim() !== '' && !allCustomers.some(c => c.name === clientName);

  const handleDelete = async () => {
    if(confirm(t('editReservation.deleteConfirm'))) {
      const { error } = await deleteReservation(reservationData.id, reservationData.car_id);
      if (error) {
        alert(`${t('common.error')}: ${error}`);
      } else {
        onClose();
      }
    }
  };

  const handleComplete = async () => {
    setStatus(t('common.processingSubmission', 'Processing submission...'), 'processing', 10);
    try {
      const reservationDataToUpdate = { 
        status: 'Completed' as const,
        odometer_in: parseInt(odometerIn) || null,
        fuel_level_in: parseInt(fuelIn) || null,
        customer_name: clientName,
        customer_phone: clientPhone,
        start_date: new Date(pickupDate).toISOString(),
        end_date: new Date(returnDate).toISOString(),
        extended_return_date: extendedReturnDate ? new Date(extendedReturnDate).toISOString() : null,
        total_price: totalPrice,
        prepayment: typeof prepayment === 'string' ? parseFloat(prepayment) || 0 : prepayment,
        deposit_type: depositType,
        deposit_amount: typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount,
        car_id: selectedCarId!,
        fuel_level_out: parseInt(fuelOut) || null,
        odometer_out: parseInt(odometerOut) || null,
        cleaned_before: cleanedBefore,
        included_items: includedItems,
        notes: notes,
        rating: rating,
      };

      const { error } = await supabase
        .from('reservations')
        .update(reservationDataToUpdate)
        .eq('id', reservationData.id);
      
      if (error) throw error;

      // Sync car status and odometer
      if (selectedCarId) {
        await supabase
          .from('cars')
          .update({ 
            status: 'Available',
            odometer: parseInt(odometerIn) || undefined,
            starting_fuel_level: parseInt(fuelIn) || undefined
          })
          .eq('id', selectedCarId);
      }

      // GAS Side Effects
      await triggerGasSideEffects({
        ...reservationDataToUpdate,
        car_brand: carBrand,
        car_model: carModel,
        license_plate: licensePlate
      });

      setStatus(t('common.success'), 'success');
      alert(t('editReservation.completeConfirm'));
      onClose();
    } catch (error: any) {
      console.error('Completion error:', error);
      setStatus(t('common.error'), 'error');
      alert(`${t('common.error')}: ${error.message}`);
    }
  };

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
          <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">{t('editReservation.title')}</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-6 py-3 text-white font-bold text-xs uppercase tracking-widest industrial-shadow hover:bg-opacity-90 transition-all ${isEditMode ? 'bg-slate-700' : 'bg-primary'}`}
            >
              {isEditMode ? <Lock className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isEditMode ? t('editReservation.lock') : t('editReservation.edit')}
            </button>
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
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
            setIncludedItems={setIncludedItems}
            handleFileUpload={handleFileUpload}
            handleCreateContract={handleCreateContract}
            isUploading={isUploading}
            isGeneratingContract={isGeneratingContract}
            disabled={!isEditMode}
          />

          {/* Footer Card */}
          <div className="px-6 py-8 sm:px-10 bg-slate-50 flex flex-col gap-8 shrink-0 border-t border-black">
            <div className="flex flex-wrap gap-x-12 gap-y-6 items-center border-l-4 border-primary pl-8 py-2">
              <div>
                <p className="text-[10px] font-bold text-ink/60 uppercase tracking-[0.2em]">{t('addReservation.totalPrice')}</p>
                <p className="text-2xl sm:text-3xl font-black text-ink">${totalPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink/60 uppercase tracking-[0.2em]">{t('addReservation.balanceDue')}</p>
                <p className="text-2xl sm:text-3xl font-black text-primary">${balanceDue.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
              <Button1 
                onClick={handleDelete}
                className="!bg-red-600 !border-red-600 hover:!bg-red-700 hover:!border-red-700"
                icon={<Trash2 className="w-5 h-5" />}
              >
                {t('common.delete')}
              </Button1>
              <Button1 
                onClick={onClose}
                className="!bg-slate-500 !border-slate-500 hover:!bg-slate-600 hover:!border-slate-600"
              >
                {t('common.cancel')}
              </Button1>
              <Button1 
                onClick={handleComplete}
                className="!bg-[#475569] !border-[#475569] hover:!bg-[#334155] hover:!border-[#334155]"
                icon={<CheckCircle className="w-5 h-5" />}
              >
                {t('addReservation.archive', 'Archive')}
              </Button1>
              <Button1 
                disabled={!isFormValid || !isEditMode || isSubmitting}
                onClick={handleConfirm}
                className="!bg-primary !border-primary hover:!bg-primary/90 hover:!border-primary/90"
                icon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              >
                {isSubmitting ? t('addReservation.recording') : t('common.save')}
              </Button1>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
