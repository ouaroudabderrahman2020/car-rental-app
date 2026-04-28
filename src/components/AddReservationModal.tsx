import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, User, Phone, CreditCard, 
  Car as CarIcon, Calendar, Monitor, ClipboardList, 
  Upload, Star, Plus, Check, Loader2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { gasService } from '../services/gasService';
import { useReservations } from '../hooks/useReservations';
import { useVerifiedTime } from '../hooks/useVerifiedTime';

interface AddReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddReservationModal({ isOpen, onClose }: AddReservationModalProps) {
  // Form State
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [extendedReturnDate, setExtendedReturnDate] = useState('');
  const [dailyRate, setDailyRate] = useState(120);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientLicense, setClientLicense] = useState('');
  const [prepayment, setPrepayment] = useState(0);
  const [depositType, setDepositType] = useState('None');
  const [depositAmount, setDepositAmount] = useState(0);
  const [odometerOut, setOdometerOut] = useState('');
  const [odometerIn, setOdometerIn] = useState('');
  const [fuelOut, setFuelOut] = useState('');
  const [fuelIn, setFuelIn] = useState('');
  const [cleanedBefore, setCleanedBefore] = useState('yes');
  const [includedItems, setIncludedItems] = useState([
    'Safety Vest', 'Warning Triangle', 'Fire Extinguisher',
    'Spare Tire', 'Lifting Jack', 'Lug Wrench'
  ]);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);

  // UI State
  const { createReservation, loading: isSubmitting } = useReservations();
  const { verifiedTime } = useVerifiedTime();
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [carListActive, setCarListActive] = useState(false);
  const [plateListActive, setPlateListActive] = useState(false);
  const [clientListActive, setClientListActive] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initial pickup date
  useEffect(() => {
    if (isOpen && !pickupDate) {
      // Localize to Morocco/Browser local-offset display but based on verified UTC
      const localVerified = new Date(verifiedTime);
      localVerified.setMinutes(localVerified.getMinutes() - localVerified.getTimezoneOffset());
      setPickupDate(localVerified.toISOString().slice(0, 16));
    }
  }, [isOpen, verifiedTime, pickupDate]);

  const validateDates = () => {
    if (pickupDate && returnDate) {
      if (new Date(returnDate) <= new Date(pickupDate)) {
        return "Return date must be after pickup date";
      }
      if (new Date(pickupDate) < new Date(verifiedTime.getTime() - 300000)) { // 5 min buffer
        return "Pickup date cannot be in the past (Server Validated)";
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
            label: 'RESERVED', 
            color: 'bg-slate-header text-white', 
            borderColor: '#475569' 
          });
        } else if (now > end) {
          setReservationState({ 
            label: 'OVERDUE', 
            color: 'bg-red-600 text-white', 
            borderColor: '#DC2626' 
          });
        } else {
          setReservationState({ 
            label: 'ACTIVE', 
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

  useEffect(() => {
    const fetchCars = async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('id, brand, model, plate, daily_rate, odometer, starting_fuel_level, status')
        .neq('status', 'In Maintenance'); // Allow Rented and Available cars
      
      if (data) setAvailableCars(data);
    };
    if (isOpen) fetchCars();
  }, [isOpen]);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      setIncludedItems([...includedItems, newItemName.trim()]);
      setNewItemName('');
    }
    setIsAddingItem(false);
  };

  const isFormValid = selectedCarId !== null && clientName.trim() !== '' && pickupDate !== '' && returnDate !== '';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const result = await gasService.uploadFile(file);
    if (result.success) {
      setUploadedDocUrl(result.fileUrl || 'File Uploaded to Drive');
      alert('Document successfully uploaded to Google Drive!');
    } else {
      alert(`Upload failed: ${result.error}`);
    }
    setIsUploading(false);
  };

  const handleConfirm = async () => {
    if (!isFormValid) return;

    // Strict Validation
    const newErrors: { [key: string]: string } = {};
    const dateError = validateDates();
    if (dateError) newErrors.dates = dateError;
    if (clientPhone && !validatePhone(clientPhone)) newErrors.phone = 'Invalid phone format';
    if (clientId && !validateId(clientId)) newErrors.id = 'Invalid ID format';
    if (clientLicense && !validateId(clientLicense)) newErrors.license = 'Invalid license format';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert(newErrors.dates || 'Please fix validation errors before proceeding.');
      return;
    }

    setErrors({});

    try {
      const { data, error } = await createReservation({
        car_id: selectedCarId!,
        customer_name: clientName,
        customer_phone: clientPhone,
        start_date: new Date(pickupDate).toISOString(),
        end_date: new Date(returnDate).toISOString(),
        status: 'Confirmed',
        total_price: totalPrice,
        fuel_level_out: parseInt(fuelOut) || null,
        odometer_out: parseInt(odometerOut) || null,
      });

      if (error) throw new Error(error);

      alert('Reservation Successfully Recorded.');
      onClose();
    } catch (error: any) {
      console.error('Error inserting reservation:', error);
      alert(`Error: ${error.message || 'Failed to record reservation'}`);
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">Add New Reservation</h2>
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-white w-full">
          {/* Section 1: Car & Schedule */}
          <div className="p-4 sm:p-10 space-y-8">
            <div className="section-header-rule">
              <div className="section-header-content">
                <CarIcon className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Car & Schedule</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Car Brand Selection</label>
                <div className="relative">
                  <input 
                    className="w-full bg-white p-4 min-h-[60px] industrial-shadow uppercase font-bold"
                    value={carBrand}
                    onChange={(e) => setCarBrand(e.target.value)}
                    onFocus={() => setCarListActive(true)}
                    onBlur={() => setTimeout(() => setCarListActive(false), 200)}
                    placeholder="Search Brand - Model (Plate)..."
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  {carListActive && (
                    <div className="combobox-list active">
                      {availableCars.filter(c => 
                        `${c.brand} ${c.model} ${c.plate}`.toLowerCase().includes(carBrand.toLowerCase())
                      ).map(car => (
                        <div key={car.id} className="combobox-item flex justify-between items-center" onClick={() => {
                          setCarBrand(car.brand);
                          setCarModel(car.model);
                          setLicensePlate(car.plate);
                          setDailyRate(car.daily_rate);
                          setSelectedCarId(car.id);
                          setOdometerOut(car.odometer.toString());
                          setFuelOut(car.starting_fuel_level?.toString() || '100');
                        }}>
                          <span>{car.brand} - {car.model} ({car.plate})</span>
                          <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${
                            car.status === 'Available' ? 'bg-primary/20 text-primary' : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            {car.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Car Model (Read-Only)</label>
                <input 
                  className="w-full bg-gray-50 p-4 min-h-[60px] industrial-shadow uppercase font-bold text-ink/60"
                  value={carModel}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">License Plate (Read-Only)</label>
                <input 
                  className="w-full bg-gray-50 p-4 min-h-[60px] industrial-shadow uppercase font-bold text-ink/60"
                  value={licensePlate}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Pick-up Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Return Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Extended Return Date (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow"
                  value={extendedReturnDate}
                  onChange={(e) => setExtendedReturnDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Reservation State</label>
                <div className="w-full bg-white p-4 min-h-[60px] flex items-center font-bold industrial-shadow" style={{ borderLeft: `4px solid ${reservationState.borderColor}` }}>
                  <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest ${reservationState.color}`}>
                    {reservationState.label}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Duration</label>
                <div className="w-full bg-muted-cream border-l-4 border-midnight-ink p-4 min-h-[60px] flex items-center font-bold text-ink/70">
                  {duration}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Daily Rate ($)</label>
                <input 
                  type="number" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow font-bold"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Total Price Calculation ($)</label>
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
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Client Profile</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="sm:col-span-2 space-y-2 relative">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Full Name</label>
                <div className="relative">
                  <input 
                    className="w-full bg-white p-4 min-h-[60px] industrial-shadow uppercase"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    onFocus={() => setClientListActive(true)}
                    onBlur={() => setTimeout(() => setClientListActive(false), 200)}
                    placeholder="Search client name..."
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  {clientListActive && (
                    <div className="combobox-list active">
                      {['Johnathan Doe', 'Jane Smith', 'Michael Scott'].map(client => (
                        <div key={client} className="combobox-item" onClick={() => setClientName(client)}>{client}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Phone Number</label>
                <input 
                  type="tel" 
                  className={`w-full bg-white p-4 min-h-[60px] industrial-shadow ${errors.phone ? 'border-2 border-red-500' : ''}`}
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
                {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">ID Card Number</label>
                <input 
                  className={`w-full bg-white p-4 min-h-[60px] industrial-shadow ${errors.id ? 'border-2 border-red-500' : ''}`}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
                {errors.id && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.id}</p>}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Driving Licence Number</label>
                <input 
                  className={`w-full bg-white p-4 min-h-[60px] industrial-shadow ${errors.license ? 'border-2 border-red-500' : ''}`}
                  value={clientLicense}
                  onChange={(e) => setClientLicense(e.target.value)}
                />
                {errors.license && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.license}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Financial Alignment */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <CreditCard className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Financial Alignment</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Prepayment</label>
                <input 
                  type="number" 
                  className="w-full p-4 text-xl font-bold bg-white"
                  value={prepayment}
                  onChange={(e) => setPrepayment(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Balance Due</label>
                <div className="py-4 text-2xl font-black text-primary px-4 border-[1.5px] border-transparent">
                  ${balanceDue.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Deposit Type</label>
                <select 
                  className="w-full p-4 bg-white text-lg"
                  value={depositType}
                  onChange={(e) => setDepositType(e.target.value)}
                >
                  <option>None</option>
                  <option>Cash</option>
                  <option>Cheque</option>
                </select>
              </div>

              <div className={`space-y-2 transition-opacity ${depositType === 'None' ? 'opacity-50' : 'opacity-100'}`}>
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Deposit Amt</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-white text-lg disabled:bg-gray-50"
                  disabled={depositType === 'None'}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
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
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Logistics Tracking</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Odometer Out', val: odometerOut, setter: setOdometerOut, placeholder: 'KM' },
                { label: 'Odometer In', val: odometerIn, setter: setOdometerIn, placeholder: 'KM' },
                { label: 'Fuel Level Out (%)', val: fuelOut, setter: setFuelOut, placeholder: '%' },
                { label: 'Fuel Level In (%)', val: fuelIn, setter: setFuelIn, placeholder: '%' },
              ].map((field) => (
                <div key={field.label} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{field.label}</label>
                  <input 
                    className="w-full p-4 bg-white text-lg"
                    value={field.val}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
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
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Details & Condition</h3>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Cleaned Before</label>
                <select 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow text-lg"
                  value={cleanedBefore}
                  onChange={(e) => setCleanedBefore(e.target.value)}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Included Items</label>
                <button 
                  onClick={() => setIsAddingItem(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-midnight-ink text-white font-bold text-xs uppercase tracking-widest industrial-shadow hover:bg-ink transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              <AnimatePresence>
                {isAddingItem && (
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
                      placeholder="New item name..."
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
                      Cancel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {includedItems.map((item) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer bg-white p-4 industrial-shadow border-[1.5px] border-form-border">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="w-6 h-6 border-2 border-midnight-ink text-primary focus:ring-0 rounded-none" 
                    />
                    <span className="text-sm font-bold uppercase">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Condition Feedback</label>
                <div className="flex gap-2 text-midnight-ink">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button 
                      key={val}
                      onClick={() => setRating(val)}
                      className={`transition-all ${rating >= val ? 'fill-midnight-ink' : ''}`}
                    >
                      <Star 
                        className={`w-10 h-10 ${rating >= val ? 'fill-current' : 'fill-none'}`} 
                        strokeWidth={1}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Notes</label>
                <textarea 
                  className="w-full bg-white p-4 min-h-[100px] industrial-shadow resize-none overflow-hidden"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (notesRef.current) {
                      notesRef.current.style.height = 'auto';
                      notesRef.current.style.height = notesRef.current.scrollHeight + 'px';
                    }
                  }}
                  ref={notesRef}
                  placeholder="Enter specific observations..."
                />
              </div>
            </div>
          </div>

          {/* Section 6: Documentation */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <Upload className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Documentation</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="relative">
                <input 
                  type="file" 
                  id="contract-upload" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label 
                  htmlFor="contract-upload"
                  className={`flex items-center gap-3 px-8 py-5 bg-muted-cream border-2 border-midnight-ink hover:bg-muted-mint transition-colors font-black text-sm uppercase tracking-[0.2em] industrial-shadow cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  {isUploading ? 'Uploading to Drive...' : 'Upload Contract PDF'}
                </label>
              </div>
              
              {uploadedDocUrl && (
                <div className="flex items-center gap-2 p-4 bg-primary/10 text-primary industrial-shadow border border-primary/20">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Document Linked</span>
                </div>
              )}

              <button className="flex items-center gap-3 px-8 py-5 bg-muted-cream border-2 border-midnight-ink hover:bg-muted-mint transition-colors font-black text-sm uppercase tracking-[0.2em] industrial-shadow">
                <Monitor className="w-6 h-6" /> Images to PDF
              </button>
            </div>
          </div>

          {/* Footer Card */}
          <div className="px-6 py-8 sm:px-10 bg-midnight-ink flex flex-col gap-8 shrink-0">
            <div className="flex flex-wrap gap-x-12 gap-y-6 items-center text-white border-l-4 border-primary pl-8 py-2">
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Total Price</p>
                <p className="text-2xl sm:text-3xl font-black">${totalPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Balance Due</p>
                <p className="text-2xl sm:text-3xl font-black text-primary">${balanceDue.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button 
                onClick={() => { alert('Reservation archived.'); onClose(); }}
                className="w-full sm:flex-1 px-8 py-5 bg-[#475569] text-white font-bold uppercase tracking-[0.2em] hover:bg-[#334155] transition-colors industrial-shadow min-h-[60px]"
              >
                ARCHIVE
              </button>
              <button 
                onClick={onClose}
                className="w-full sm:flex-1 px-8 py-5 text-white font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors border border-white/20 min-h-[60px]"
              >
                CANCEL
              </button>
              <button 
                disabled={!isFormValid || isSubmitting}
                onClick={handleConfirm}
                className={`w-full sm:flex-[1.5] px-8 py-5 bg-primary text-white font-black uppercase tracking-[0.2em] industrial-shadow transition-all min-h-[60px] flex items-center justify-center gap-2 ${(!isFormValid || isSubmitting) ? 'opacity-50 pointer-events-none' : 'active:scale-[0.98]'}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    RECORDING...
                  </>
                ) : 'CONFIRM CONTRACT'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
