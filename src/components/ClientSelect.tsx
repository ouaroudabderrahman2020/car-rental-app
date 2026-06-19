import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, CreditCard, Monitor, XCircle, Loader2, AlertCircle, CheckCircle, Plus, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateClientId } from '../utils/idGenerator';
import type { ReservationFormData } from './ResForm';

interface ClientSelectProps {
  reservation?: Partial<ReservationFormData> | null;
  onChange: (data: Partial<ReservationFormData>) => void;
  errors: { [key: string]: string };
  set: (field: string, value: any) => void;
  selectedCustomer: any | null;
  setSelectedCustomer: (customer: any | null) => void;
}

const InputField = (props: any) => {
  const { label: _, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-500 ${props.className || ''}`}
    />
  );
};

export default function ClientSelect({ reservation, onChange, errors, set, selectedCustomer, setSelectedCustomer }: ClientSelectProps) {
  const { t } = useTranslation();
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [isClientSearchListActive, setIsClientSearchListActive] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  const [isClientViewModalOpen, setIsClientViewModalOpen] = useState(false);

  useEffect(() => {
    supabase.from('clients').select('*').then(({ data }) => {
      if (data) setAllCustomers(data);
    });
  }, []);

  const handleRegisterClient = async () => {
    if (!reservation?.clientName || !reservation?.clientId || !reservation?.clientLicense) return;
    setIsRegistering(true);
    setRegistrationStatus(null);
    try {
      const { data: existingClients, error: checkError } = await supabase
        .from('clients')
        .select('national_id, license_number')
        .or(`national_id.eq.${reservation.clientId},license_number.eq.${reservation.clientLicense}`);
      if (checkError) throw checkError;
      if (existingClients && existingClients.length > 0) {
        const idExists = existingClients.some(c => c.national_id === reservation.clientId);
        const licenseExists = existingClients.some(c => c.license_number === reservation.clientLicense);
        let msg = "";
        if (idExists && licenseExists) msg = "id card and driving number already exist";
        else if (idExists) msg = "id card already exist";
        else msg = "driving number already exist";
        setRegistrationStatus({ type: 'warning', message: msg });
        setIsRegistering(false);
        return;
      }
      const { error: insertError } = await supabase
        .from('clients')
        .insert([{
          id: generateClientId(),
          name: reservation.clientName,
          national_id: reservation.clientId,
          license_number: reservation.clientLicense,
          trust_rank: 0,
        }]);
      if (insertError) throw insertError;
      setRegistrationStatus({ type: 'success', message: 'client added' });
      const { data: updatedCustomers } = await supabase.from('clients').select('*');
      if (updatedCustomers) setAllCustomers(updatedCustomers);
    } catch (err) {
      console.error(err);
      setRegistrationStatus({ type: 'error', message: 'error happened, try again' });
    } finally {
      setIsRegistering(false);
    }
  };

  const isRegisterEnabled = !!(reservation?.clientName?.trim() && reservation?.clientId?.trim() && reservation?.clientLicense?.trim() && !selectedCustomer);

  const handleResetCustomerSection = () => {
    setSelectedCustomer(null);
    setRegistrationStatus(null);
    onChange({
      ...(reservation || {}),
      clientSearchQuery: '',
      clientName: '',
      clientId: '',
      clientLicense: '',
    } as Partial<ReservationFormData>);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[16px] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 text-xs font-semibold text-white bg-sky-600 px-5 py-3.5">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/25 text-white text-[10px] font-black leading-none shrink-0">1</span>
        <User className="w-4 h-4 shrink-0 text-white" />
        <span>{t('reservations.form.client', 'Client')}</span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="w-full flex flex-col">
          <span className="text-xs font-semibold text-slate-600 mb-1">{t('reservations.form.searchClient', 'Search Client')}</span>
          <div className="flex flex-col relative w-full">
            <div className="relative group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10" />
              <input
                type="text"
                value={reservation?.clientSearchQuery || ''}
                onChange={(e) => {
                  set('clientSearchQuery', e.target.value);
                  setIsClientSearchListActive(e.target.value.length > 0);
                }}
                onFocus={() => (reservation?.clientSearchQuery?.length || 0) > 0 && setIsClientSearchListActive(true)}
                onBlur={() => setTimeout(() => setIsClientSearchListActive(false), 200)}
                placeholder={t('reservations.form.searchPlaceholder', 'Type name, ID or license to search...')}
                className="w-full h-9 bg-white border border-slate-200 rounded-[12px] pl-10 pr-10 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all truncate"
              />
              {reservation?.clientSearchQuery && (
                <button
                  onClick={() => {
                    set('clientSearchQuery', '');
                    setIsClientSearchListActive(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-all z-20"
                >
                  <XCircle className="w-4 h-4" />
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
                      c.name.toLowerCase().includes((reservation?.clientSearchQuery || '').toLowerCase()) ||
                      (c.national_id || '').toLowerCase().includes((reservation?.clientSearchQuery || '').toLowerCase()) ||
                      (c.license_number || '').toLowerCase().includes((reservation?.clientSearchQuery || '').toLowerCase())
                    ).map(customer => (
                      <div
                        key={customer.id}
                        className="px-4 py-2 text-sm font-bold border-b border-black/5 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors group"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          onChange({
                            ...(reservation || {}),
                            clientName: customer.name,
                            clientId: customer.national_id || '',
                            clientLicense: customer.license_number || '',
                            clientSearchQuery: customer.name,
                          } as Partial<ReservationFormData>);
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
        </div>

        {selectedCustomer ? (
          <>
            <div className="w-full flex flex-col">
              <span className="text-xs font-semibold text-slate-600 mb-1">{t('reservations.form.fullName', 'Full Name')}</span>
              <button
                onClick={() => setIsClientViewModalOpen(true)}
                className="w-full h-9 bg-blue-50 border border-blue-200 rounded-[12px] px-3 flex items-center gap-2 text-sm font-semibold text-blue-900 hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
              >
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate uppercase">{reservation?.clientName || ''}</span>
              </button>
            </div>
            <div className="w-full flex flex-col">
              <span className="text-xs font-semibold text-slate-600 mb-1">{t('reservations.form.idCardNumber', 'ID Card Number')}</span>
              <button
                onClick={() => setIsClientViewModalOpen(true)}
                className="w-full h-9 bg-blue-50 border border-blue-200 rounded-[12px] px-3 flex items-center gap-2 text-sm font-semibold text-blue-900 hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
              >
                <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate uppercase">{reservation?.clientId || ''}</span>
              </button>
            </div>
            <div className="w-full flex flex-col">
              <span className="text-xs font-semibold text-slate-600 mb-1">{t('reservations.form.licenseNumber', 'License Number')}</span>
              <button
                onClick={() => setIsClientViewModalOpen(true)}
                className="w-full h-9 bg-blue-50 border border-blue-200 rounded-[12px] px-3 flex items-center gap-2 text-sm font-semibold text-blue-900 hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
              >
                <Monitor className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate uppercase">{reservation?.clientLicense || ''}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-full flex flex-col">
              <span className="text-xs font-semibold text-slate-600 mb-1">{t('reservations.form.fullName', 'Full Name')}<span className="text-red-500 ml-0.5">*</span></span>
              <div className="flex">
                <InputField
                  type="text"
                  value={reservation?.clientName || ''}
                  onChange={(e: any) => set('clientName', e.target.value)}
                  placeholder={t('reservations.form.clientPlaceholder', 'Enter client name...')}
                  className={`flex-1 min-w-0 ${errors.clientName ? 'border-red-500 ring-2 ring-red-100' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => set('clientName', reservation?.clientSearchQuery || '')}
                  className="px-3 bg-slate-50 border border-slate-200 border-l-0 rounded-r-[12px] text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0"
                  title="Copy from search"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
                </button>
              </div>
            </div>
            <div className="w-full flex flex-col">
              <span className="text-xs font-semibold text-slate-600 mb-1">{t('reservations.form.idCardNumber', 'ID Card Number')}<span className="text-red-500 ml-0.5">*</span></span>
              <div className="flex">
                <InputField
                  type="text"
                  value={reservation?.clientId || ''}
                  onChange={(e: any) => set('clientId', e.target.value)}
                  placeholder={t('reservations.form.idPlaceholder', 'ID Card...')}
                  className={`flex-1 min-w-0 ${errors.clientId ? 'border-red-500 ring-2 ring-red-100' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => set('clientId', reservation?.clientSearchQuery || '')}
                  className="px-3 bg-slate-50 border border-slate-200 border-l-0 rounded-r-[12px] text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
                </button>
              </div>
            </div>
            <div className="w-full flex flex-col">
              <span className="text-xs font-semibold text-slate-600 mb-1">{t('reservations.form.licenseNumber', 'License Number')}<span className="text-red-500 ml-0.5">*</span></span>
              <div className="flex">
                <InputField
                  type="text"
                  value={reservation?.clientLicense || ''}
                  onChange={(e: any) => set('clientLicense', e.target.value)}
                  placeholder={t('reservations.form.licensePlaceholder', 'License Num...')}
                  className={`flex-1 min-w-0 ${errors.clientLicense ? 'border-red-500 ring-2 ring-red-100' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => set('clientLicense', reservation?.clientSearchQuery || '')}
                  className="px-3 bg-slate-50 border border-slate-200 border-l-0 rounded-r-[12px] text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
                </button>
              </div>
            </div>
          </>
        )}

        <div className="w-full flex flex-col">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                onClick={handleResetCustomerSection}
                disabled={isRegistering}
                className="h-9 px-4 rounded-[12px] text-[10px] font-bold uppercase tracking-wider border border-slate-200 transition-all flex items-center justify-center gap-2 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t('common.reset', 'Reset')}
              </button>
              <button
                onClick={handleRegisterClient}
                disabled={!isRegisterEnabled || isRegistering}
                className={`h-9 px-6 rounded-[12px] text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                  !isRegisterEnabled
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-[#0066FF] text-white border-[#0066FF] hover:bg-blue-700'
                }`}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t('common.processing', 'Processing...')}
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    {t('reservations.form.registerClientButton', 'Register')}
                  </>
                )}
              </button>
            </div>
            {registrationStatus && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-[12px] border text-[10px] font-bold uppercase tracking-wider ${
                registrationStatus.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                registrationStatus.type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-700' :
                'bg-red-50 border-red-500 text-red-700'
              }`}>
                {registrationStatus.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {registrationStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
