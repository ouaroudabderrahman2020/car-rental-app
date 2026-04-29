import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, User, Phone, CreditCard, 
  Car as CarIcon, Calendar, Monitor, ClipboardList, 
  Upload, Star, Plus, Check, Edit, Lock, Trash2, RotateCcw, ArrowRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Reservation } from '../types';

interface ReservationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationData: any; // Using any for expanded data
}

export default function ReservationDetailsModal({ isOpen, onClose, reservationData }: ReservationDetailsModalProps) {
  const { t } = useTranslation();
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [carBrand, setCarBrand] = useState(reservationData?.carBrand || '');
  const [carModel, setCarModel] = useState(reservationData?.car || '');
  const [licensePlate, setLicensePlate] = useState(reservationData?.plate || 'PLATE-01');
  const [pickupDate, setPickupDate] = useState(reservationData?.pickupDate || '2023-10-12T10:00');
  const [returnDate, setReturnDate] = useState(reservationData?.returnDate || '2023-10-15T10:00');
  const [extendedReturnDate, setExtendedReturnDate] = useState(reservationData?.extendedReturnDate || '');
  const [dailyRate, setDailyRate] = useState(reservationData?.rate || 150);
  const [clientName, setClientName] = useState(reservationData?.client || '');
  const [clientPhone, setClientPhone] = useState(reservationData?.phone || '+1 555-0987-654');
  const [clientId, setClientId] = useState(reservationData?.clientId || 'ID-9921102');
  const [clientLicense, setClientLicense] = useState(reservationData?.license || 'DL-K882-9901');
  const [prepayment, setPrepayment] = useState(reservationData?.prepayment || 100);
  const [depositType, setDepositType] = useState(reservationData?.depositType || 'Cash');
  const [depositAmount, setDepositAmount] = useState(reservationData?.depositAmount || 500);
  const [odometerOut, setOdometerOut] = useState(reservationData?.odometerOut || '12,500');
  const [odometerIn, setOdometerIn] = useState(reservationData?.odometerIn || '12,850');
  const [fuelOut, setFuelOut] = useState(reservationData?.fuelOut || '100');
  const [fuelIn, setFuelIn] = useState(reservationData?.fuelIn || '95');
  const [cleanedBefore, setCleanedBefore] = useState(reservationData?.cleanedBefore || 'no');
  const [includedItems, setIncludedItems] = useState([
    'Safety Vest', 'Warning Triangle', 'Fire Extinguisher',
    'Spare Tire', 'Lifting Jack', 'Lug Wrench'
  ]);
  const [notes, setNotes] = useState(reservationData?.notes || 'Vehicle was delivered in immaculate condition. Minor scuff on front left rim already noted.');
  const [rating, setRating] = useState(reservationData?.rating || 4);

  // UI State
  const [carListActive, setCarListActive] = useState(false);
  const [plateListActive, setPlateListActive] = useState(false);
  const [clientListActive, setClientListActive] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Calculations
  const [duration, setDuration] = useState('0 Days, 0 Hours');
  const [totalPrice, setTotalPrice] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);

  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (reservationData) {
      setCarBrand(reservationData.carBrand || '');
      setCarModel(reservationData.car || '');
      setClientName(reservationData.client || '');
    }
  }, [reservationData]);

  useEffect(() => {
    const calculate = () => {
      const start = new Date(pickupDate);
      const end = extendedReturnDate ? new Date(extendedReturnDate) : new Date(returnDate);

      if (start.getTime() && end.getTime() && end > start) {
        const diffMs = end.getTime() - start.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);
        const d = Math.floor(totalHours / 24);
        const h = Math.floor(totalHours % 24);
        setDuration(`${d} Days, ${h} Hours`);

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

  const isFormValid = carModel.trim() !== '' && clientName.trim() !== '';

  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!reservationData?.id) return;
    if (confirm(t('reservationDetails.deleteConfirm'))) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('reservations')
          .delete()
          .eq('id', reservationData.id);
        
        if (error) throw error;
        alert(t('editReservation.updateSuccess'));
        onClose();
      } catch (error: any) {
        console.error('Delete error:', error);
        alert(t('common.error'));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleReactivate = async () => {
    if (!reservationData?.id) return;
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'Confirmed' })
        .eq('id', reservationData.id);
      
      if (error) throw error;
      alert(t('reservationDetails.reactivateSuccess'));
      onClose();
    } catch (error: any) {
      alert(t('reservationDetails.reactivateError'));
    }
  };

  const handleConfirm = async () => {
    if (!isFormValid || !reservationData?.id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          customer_name: clientName,
          customer_phone: clientPhone,
          start_date: new Date(pickupDate).toISOString(),
          end_date: new Date(returnDate).toISOString(),
          total_price: totalPrice,
          odometer_out: parseInt(odometerOut) || 0,
          odometer_in: parseInt(odometerIn) || 0,
          fuel_level_out: parseInt(fuelOut) || 0,
          fuel_level_in: parseInt(fuelIn) || 0,
          notes: notes
        })
        .eq('id', reservationData.id);

      if (error) throw error;
      alert(t('editReservation.updateSuccess'));
      setIsEditMode(false);
      onClose();
    } catch (error: any) {
      alert(t('common.error'));
    } finally {
      setIsSubmitting(false);
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
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">{t('reservationDetails.title')}</h2>
            <div className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] industrial-shadow">{reservationData?.status?.toUpperCase()}</div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-6 py-3 text-white font-bold text-xs uppercase tracking-widest industrial-shadow transition-all ${isEditMode ? 'bg-slate-700' : 'bg-primary'}`}
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
          {/* Section 1: Car & Schedule */}
          <div className="p-4 sm:p-10 space-y-8">
            <div className="section-header-rule">
              <div className="section-header-content">
                <CarIcon className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('reservations.form.carSchedule')}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.brandSelection')}</label>
                <div className="relative">
                  <input 
                    className="w-full bg-white p-4 min-h-[60px] industrial-shadow uppercase font-bold disabled:bg-slate-50 disabled:cursor-default"
                    value={carBrand}
                    onChange={(e) => setCarBrand(e.target.value)}
                    onFocus={() => isEditMode && setCarListActive(true)}
                    onBlur={() => setTimeout(() => setCarListActive(false), 200)}
                    disabled={!isEditMode}
                    placeholder={t('reservations.form.brandPlaceholder')}
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 w-5 h-5" />
                  {carListActive && isEditMode && (
                    <div className="combobox-list active">
                      {['Audi - A6 (ABC-1234)', 'BMW - 3 Series (XYZ-7890)', 'Tesla - Model 3 (TSL-333)'].map(carLabel => (
                        <div key={carLabel} className="combobox-item" onClick={() => {
                          const [brand, rest] = carLabel.split(' - ');
                          const [model, plateWithParens] = rest.split(' (');
                          const plate = plateWithParens.replace(')', '');
                          setCarBrand(brand);
                          setCarModel(model);
                          setLicensePlate(plate);
                        }}>{carLabel}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.modelReadOnly')}</label>
                <input 
                  className="w-full bg-gray-50 p-4 min-h-[60px] industrial-shadow uppercase font-bold text-ink/60 disabled:cursor-default"
                  value={carModel}
                  readOnly
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.plateReadOnly')}</label>
                <input 
                  className="w-full bg-gray-50 p-4 min-h-[60px] industrial-shadow uppercase font-bold text-ink/60 disabled:cursor-default"
                  value={licensePlate}
                  readOnly
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.pickupDate')}</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-50"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.returnDate')}</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-50"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.extendedReturn')}</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-50"
                  value={extendedReturnDate}
                  onChange={(e) => setExtendedReturnDate(e.target.value)}
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.duration')}</label>
                <div className="w-full bg-muted-cream border-l-4 border-midnight-ink p-4 min-h-[60px] flex items-center font-bold text-ink/70">
                  {duration}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.dailyRate')}</label>
                <input 
                  type="number" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow font-bold disabled:bg-slate-50"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(Number(e.target.value))}
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.totalPriceCalc')}</label>
                <div className="w-full bg-muted-mint p-4 min-h-[60px] flex items-center justify-center font-black text-2xl text-ink industrial-shadow border-[1.5px] border-form-border">
                  {totalPrice.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Client Profile */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <User className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('reservations.form.clientProfile')}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="sm:col-span-2 space-y-1 relative">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.fullName')}</label>
                <div className="relative">
                  <input 
                    className="w-full bg-white p-4 min-h-[60px] industrial-shadow uppercase disabled:bg-slate-50"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    onFocus={() => isEditMode && setClientListActive(true)}
                    onBlur={() => setTimeout(() => setClientListActive(false), 200)}
                    disabled={!isEditMode}
                    placeholder={t('reservations.form.clientPlaceholder')}
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 w-5 h-5" />
                  {clientListActive && isEditMode && (
                    <div className="combobox-list active">
                      {['Johnathan Doe', 'Jane Smith', 'Michael Scott', 'Alexander Pierce'].map(client => (
                        <div key={client} className="combobox-item" onClick={() => setClientName(client)}>{client}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.phoneNumber')}</label>
                <input 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-50"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  disabled={!isEditMode}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.idCardNumber')}</label>
                <input 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-50"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={!isEditMode}
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.licenseNumber')}</label>
                <input 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-50"
                  value={clientLicense}
                  onChange={(e) => setClientLicense(e.target.value)}
                  disabled={!isEditMode}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financial Alignment */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <CreditCard className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('reservations.form.financialAlignment')}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.prepayment')}</label>
                <input 
                  type="number" 
                  className="w-full p-4 text-xl font-bold bg-white disabled:bg-slate-50"
                  value={prepayment}
                  onChange={(e) => setPrepayment(Number(e.target.value))}
                  disabled={!isEditMode}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.balanceDue')}</label>
                <div className="py-4 text-2xl font-black text-primary px-4 border-[1.5px] border-transparent">
                  ${balanceDue.toFixed(2)}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.depositType')}</label>
                <select 
                  className="w-full p-4 bg-white text-lg disabled:bg-slate-50"
                  value={depositType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setDepositType(newType);
                    if (newType === 'None') {
                      setDepositAmount(0);
                    }
                  }}
                  disabled={!isEditMode}
                >
                  <option value="Cash">{t('reservations.form.cash')}</option>
                  <option value="Cheque">{t('reservations.form.cheque')}</option>
                  <option value="None">{t('reservations.form.none')}</option>
                </select>
              </div>
              <div className={`space-y-2 transition-opacity ${depositType === 'None' || !isEditMode ? 'opacity-50' : 'opacity-100'}`}>
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.depositAmt')}</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-white text-lg disabled:bg-slate-50"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  disabled={!isEditMode || depositType === 'None'}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Logistics Tracking */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <Monitor className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('reservations.form.logisticsTracking')}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: t('reservations.form.odometerOut'), val: odometerOut, setter: setOdometerOut },
                { label: t('reservations.form.odometerIn'), val: odometerIn, setter: setOdometerIn },
                { label: t('reservations.form.fuelOut'), val: fuelOut, setter: setFuelOut },
                { label: t('reservations.form.fuelIn'), val: fuelIn, setter: setFuelIn },
              ].map((field) => (
                <div key={field.label} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{field.label}</label>
                  <input 
                    className="w-full p-4 bg-white text-lg disabled:bg-slate-50"
                    value={field.val}
                    onChange={(e) => field.setter(e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Details & Condition */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <ClipboardList className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('reservations.form.detailsCondition')}</h3>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.cleanedBefore')}</label>
                <select 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow text-lg disabled:bg-slate-50"
                  value={cleanedBefore}
                  onChange={(e) => setCleanedBefore(e.target.value)}
                  disabled={!isEditMode}
                >
                  <option value="yes">{t('reservations.form.yes')}</option>
                  <option value="no">{t('reservations.form.no')}</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.includedItems')}</label>
                {isEditMode && (
                  <button 
                    onClick={() => setIsAddingItem(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-midnight-ink text-white font-bold text-xs uppercase tracking-widest industrial-shadow hover:bg-ink transition-all"
                  >
                    <Plus className="w-4 h-4" /> {t('reservations.form.addItem')}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isAddingItem && isEditMode && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-2 flex-wrap"
                  >
                    <input 
                      className="flex-1 p-3 text-sm uppercase industrial-shadow"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder={t('reservations.form.newItemPlaceholder')}
                      autoFocus
                    />
                    <button 
                      onClick={handleAddItem}
                      className="px-4 py-3 bg-primary text-white font-bold text-xs uppercase tracking-widest industrial-shadow flex items-center justify-center min-w-[50px]"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setIsAddingItem(false)}
                      className="px-4 py-3 bg-slate-200 text-ink font-bold text-xs uppercase tracking-widest flex items-center justify-center"
                    >
                      {t('common.cancel')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {includedItems.map((item) => (
                  <label key={item} className="flex items-center gap-3 cursor-default bg-white p-4 industrial-shadow border-[1.5px] border-form-border">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="w-6 h-6 border-2 border-midnight-ink text-primary focus:ring-0 rounded-none disabled:bg-slate-50" 
                      disabled={!isEditMode}
                    />
                    <span className="text-sm font-bold uppercase">{item}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.conditionFeedback')}</label>
                <div className={`flex gap-2 text-midnight-ink transition-opacity ${!isEditMode ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button key={val} onClick={() => isEditMode && setRating(val)} className={`transition-all`}>
                      <Star 
                        className={`w-10 h-10 ${rating >= val ? 'fill-current' : 'fill-none'}`} 
                        strokeWidth={1}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('reservations.form.notes')}</label>
                <textarea 
                  className="w-full bg-white p-4 min-h-[100px] industrial-shadow resize-none disabled:bg-slate-50"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (notesRef.current) {
                      notesRef.current.style.height = 'auto';
                      notesRef.current.style.height = notesRef.current.scrollHeight + 'px';
                    }
                  }}
                  ref={notesRef}
                  disabled={!isEditMode}
                />
              </div>
            </div>
          </div>

          {/* Section 6: Documentation */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <Upload className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">{t('reservations.form.documentation')}</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <button 
                disabled={!isEditMode}
                className={`flex items-center gap-3 px-8 py-5 bg-muted-cream border-2 border-midnight-ink font-black text-sm uppercase tracking-[0.2em] industrial-shadow transition-all ${!isEditMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted-mint'}`}
              >
                <Upload className="w-6 h-6" /> {t('reservations.form.uploadContract')}
              </button>
              <button 
                disabled={!isEditMode}
                className={`flex items-center gap-3 px-8 py-5 bg-muted-cream border-2 border-midnight-ink font-black text-sm uppercase tracking-[0.2em] industrial-shadow transition-all ${!isEditMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted-mint'}`}
              >
                <Monitor className="w-6 h-6" /> {t('reservations.form.gallery')}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-8 sm:px-10 bg-midnight-ink flex flex-col gap-8 shrink-0">
            <div className="flex flex-wrap gap-x-12 gap-y-6 items-center text-white border-l-4 border-primary pl-8 py-2">
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">{t('reservations.totalAmount')}</p>
                <p className="text-2xl sm:text-3xl font-black">${totalPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">{t('reservations.form.balanceDue')}</p>
                <p className="text-2xl sm:text-3xl font-black text-primary">${balanceDue.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 w-full">
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-5 text-red-500 font-bold uppercase tracking-[0.2em] border border-red-500/30 hover:bg-red-500/10 transition-colors min-h-[60px] flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('editReservation.delete')}
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-5 text-white font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors border border-white/20 min-h-[60px]"
              >
                {t('reservationDetails.close')}
              </button>
              <button 
                onClick={handleReactivate}
                className="px-4 py-5 text-white font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors border border-white/20 min-h-[60px]"
              >
                <RotateCcw className="w-4 h-4 inline mr-2" /> {t('reservationDetails.reactivate')}
              </button>
              <button 
                onClick={() => { alert(t('reservationDetails.rebookSuccess')); onClose(); }}
                className="px-4 py-5 bg-slate-700 text-white font-bold uppercase tracking-[0.2em] hover:bg-slate-600 transition-colors min-h-[60px]"
              >
                <ArrowRight className="w-4 h-4 inline mr-2" /> {t('reservationDetails.rebook')}
              </button>
              <button 
                disabled={!isFormValid || !isEditMode || isSubmitting}
                onClick={handleConfirm}
                className={`px-4 py-5 bg-white text-midnight-ink font-black uppercase tracking-[0.2em] industrial-shadow transition-all min-h-[60px] flex items-center justify-center gap-2 ${(!isFormValid || !isEditMode || isSubmitting) ? 'opacity-50 pointer-events-none' : 'active:scale-[0.98]'}`}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <Check className="w-4 h-4 inline mr-2" /> {isSubmitting ? t('common.saving') : t('reservationDetails.confirm')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
