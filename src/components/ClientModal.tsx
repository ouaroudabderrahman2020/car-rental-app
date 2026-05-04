import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Phone, CreditCard, Calendar, Shield, History, Trash2, Check, Edit2, Mail, MapPin, Globe, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Customer, Reservation } from '../types';
import { useStatus } from '../contexts/StatusContext';
import Field1 from './Field1';
import FormSection from './FormSection';
import BaseModal from './BaseModal';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  client?: Customer | null;
  reservations?: Reservation[];
  onRefresh?: () => void;
}

export default function ClientModal({ isOpen, onClose, mode, client, reservations = [], onRefresh }: ClientModalProps) {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  const [isEditing, setIsEditing] = useState(mode === 'add');
  
  // Form State
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [licenseIssue, setLicenseIssue] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState('5');
  const [notes, setNotes] = useState('');
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && client) {
        setName(client.name || '');
        setNationalId(client.national_id || client.id_card_number || '');
        setDob(client.dob || '');
        setNationality(client.nationality || '');
        setLicenseNumber(client.license_number || '');
        setLicenseExpiry(client.license_expiry || '');
        setLicenseIssue(client.license_issue || '');
        setPhone(client.phone || '');
        setEmail(client.email || '');
        setAddress(client.address || '');
        setRating(client.trust_rank?.toString() || '5');
        setNotes(client.notes || '');
        setIsBlacklisted(client.is_blacklisted || false);
        setIsEditing(false);
      } else {
        setName('');
        setNationalId('');
        setDob('');
        setNationality('');
        setLicenseNumber('');
        setLicenseExpiry('');
        setLicenseIssue('');
        setPhone('');
        setEmail('');
        setAddress('');
        setRating('5');
        setNotes('');
        setIsBlacklisted(false);
        setIsEditing(true);
      }
    }
  }, [client, isOpen, mode]);

  const handleSave = async () => {
    if (!name || !phone) {
      setStatus(t('common.requiredFields', 'Name and Phone are required.'), 'error');
      return;
    }

    setIsSubmitting(true);
    setStatus("SAVING CLIENT DATA...", 'processing', 0);
    try {
      const payload = {
        name,
        national_id: nationalId,
        id_card_number: nationalId,
        dob,
        nationality,
        license_number: licenseNumber,
        license_expiry: licenseExpiry,
        license_issue: licenseIssue,
        phone,
        email,
        address,
        trust_rank: parseInt(rating) || 5,
        notes,
        is_blacklisted: isBlacklisted
      };

      if (mode === 'edit' && client?.id) {
        const { error } = await supabase
          .from('customers')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{ ...payload, created_at: new Date().toISOString() }]);
        if (error) throw error;
      }
      
      setStatus("CLIENT SAVED SUCCESSFULLY", 'success');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setStatus(`${t('common.error')}: ${err.message || ''}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!client?.id) return;
    if (!window.confirm(t('common.confirmation'))) return;
    
    setIsSubmitting(true);
    setStatus("DELETING CLIENT...", 'processing', 0);
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', client.id);
      
      if (error) throw error;
      setStatus("CLIENT DELETED", 'success');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      console.error('Delete error:', err);
      setStatus(`${t('common.error')}: ${err.message || ''}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientReservations = client ? reservations
    .filter(r => r.customer_phone === client.phone)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()) : [];

  const isLicenseExpiredCheck = new Date(licenseExpiry) < new Date();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <h2 className="text-xl font-black uppercase tracking-tight text-ink flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            {mode === 'add' ? t('clientForm.addTitle', 'ADD NEW CLIENT') : (isEditing ? t('crm.modal.edit') : t('crm.modal.title'))}
          </h2>
          {mode === 'edit' && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-ink/5 transition-colors border border-transparent hover:border-midnight-ink/10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/70"
            >
              <Edit2 className="w-4 h-4" />
              {t('crm.modal.edit')}
            </button>
          )}
        </div>
      }
      footer={
        <div className="px-6 py-6 bg-white flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 border-2 border-midnight-ink font-bold text-xs uppercase tracking-widest hover:bg-ink/5 transition-all text-ink disabled:opacity-50"
            >
              {isEditing ? t('common.cancel') : t('crm.modal.close')}
            </button>
            {mode === 'edit' && !isEditing && (
              <button 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-6 py-3 border-2 border-red-500 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {t('crm.modal.delete')}
              </button>
            )}
          </div>
          
          {isEditing && (
            <button 
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-10 py-3 bg-midnight-ink text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-primary transition-all industrial-shadow flex items-center gap-2 min-w-[140px] justify-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isSubmitting ? t('common.saving') : (mode === 'add' ? t('common.add') : t('common.save', 'SAVE CHANGES'))}
            </button>
          )}
        </div>
      }
    >
      <div className="p-6 sm:p-8 space-y-8">
        {isEditing ? (
          <div className="space-y-6">
          <div className="space-y-8 bg-white p-6">
            <FormSection title={t('clientForm.identity', 'Identity')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field1 label={t('clientForm.fullName', 'Full Name')} value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} />
                <Field1 label={t('clientForm.nationalId', 'National ID / Passport')} value={nationalId} onChange={(e) => setNationalId(e.target.value)} disabled={isSubmitting} />
                <Field1 label={t('clientForm.dob', 'Date of Birth')} type="date" value={dob} onChange={(e) => setDob(e.target.value)} disabled={isSubmitting} />
                <Field1 label={t('clientForm.nationality', 'Nationality')} value={nationality} onChange={(e) => setNationality(e.target.value)} disabled={isSubmitting} />
              </div>
            </FormSection>

            <FormSection title={t('clientForm.credentials', 'Driving Credentials')}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field1 label={t('clientForm.licenseNumber', 'License Number')} value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} disabled={isSubmitting} />
                <Field1 label={t('clientForm.licenseExpiry', 'License Expiry')} type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} disabled={isSubmitting} />
                <Field1 label={t('clientForm.licenseIssue', 'License Issue')} type="date" value={licenseIssue} onChange={(e) => setLicenseIssue(e.target.value)} disabled={isSubmitting} />
              </div>
            </FormSection>

            <FormSection title={t('clientForm.contact', 'Contact & Verification')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field1 label={t('clientForm.phone', 'Phone Number')} value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSubmitting} />
                <Field1 label={t('clientForm.email', 'Email Address')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                <div className="md:col-span-2">
                  <Field1 label={t('clientForm.address', 'Physical Address')} value={address} onChange={(e) => setAddress(e.target.value)} disabled={isSubmitting} />
                </div>
              </div>
            </FormSection>

            <FormSection title={t('clientForm.trust', 'Trust & Rating')}>
              <div className="space-y-4">
                <Field1 label={t('clientForm.rating', 'Rating (1-5 Stars)')} type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} disabled={isSubmitting} />
                <Field1 as="textarea" label={t('clientForm.notes', 'Internal Notes')} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isSubmitting} />
              </div>
            </FormSection>
          </div>
            {mode === 'edit' && (
              <div className="flex items-center gap-3 p-6 bg-slate-50 border border-slate-200">
                <input 
                  type="checkbox" 
                  id="blacklist-check"
                  checked={isBlacklisted}
                  onChange={(e) => setIsBlacklisted(e.target.checked)}
                  className="w-5 h-5 accent-red-600"
                  disabled={isSubmitting}
                />
                <label htmlFor="blacklist-check" className="font-bold uppercase tracking-widest text-xs text-red-600 cursor-pointer">
                  {t('crm.modal.markAsBlacklisted', 'Mark as Blacklisted')}
                </label>
              </div>
            )}
          </div>
        ) : (
          client && (
            <>
              {/* Profile Overview */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className={`w-24 h-24 flex items-center justify-center border-4 ${isBlacklisted ? 'border-red-500 bg-red-50' : 'border-midnight-ink bg-white'} industrial-shadow shrink-0`}>
                  <User className={`w-12 h-12 ${isBlacklisted ? 'text-red-500' : 'text-midnight-ink'}`} />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={`text-2xl font-black uppercase tracking-tight ${isBlacklisted ? 'text-red-600' : 'text-ink'}`}>
                      {name}
                    </h3>
                    {isBlacklisted && (
                      <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] industrial-shadow animate-pulse">
                        {t('crm.modal.blacklisted')}
                      </span>
                    )}
                  </div>
                  <p className="text-ink/60 font-mono text-sm">{client.id}</p>
                </div>
              </div>

              {/* Informational Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 border-b border-ink/10 pb-2">{t('crm.modal.details')}</h4>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-bold">{phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="font-bold">{email || '---'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-bold">{address || '---'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="font-bold">{nationalId || '---'}</span>
                  </div>
                </div>

                {/* Compliance Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 border-b border-ink/10 pb-2">COMPLIANCE</h4>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-ink/40 tracking-widest">{t('crm.modal.license')}</span>
                      <span className="font-bold">{licenseNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-ink/40 tracking-widest">{t('crm.modal.licenseExpiry')}</span>
                      <span className={`font-bold ${isLicenseExpiredCheck ? 'text-red-500' : 'text-emerald-600'}`}>
                        {licenseExpiry || '---'} {isLicenseExpiredCheck && `(${t('crm.modal.safety.expired')})`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-ink/40 tracking-widest">{t('clientForm.nationality')}</span>
                      <span className="font-bold">{nationality || '---'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking History Section */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b-2 border-midnight-ink pb-2">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
                    <History className="w-4 h-4" />
                    {t('crm.modal.bookingHistory')}
                  </h4>
                  <span className="text-[10px] font-bold text-ink/40 bg-ink/5 px-2 py-0.5">{clientReservations.length} {t('crm.modal.rentals')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clientReservations.slice(0, 4).map((res) => (
                    <div key={res.id} className="bg-slate-50 border border-slate-200 p-4 transition-all hover:border-primary group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-black text-ink text-xs uppercase tracking-tight">{res.car?.brand} {res.car?.model}</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 ${
                          res.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          res.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-primary/20 text-primary'
                        }`}>
                          {res.status}
                        </span>
                      </div>
                      <p className="text-[9px] font-mono text-ink/40 mb-2">{res.start_date} → {res.end_date}</p>
                      <p className="font-black text-midnight-ink text-sm uppercase">{res.total_price.toFixed(0)} MAD</p>
                    </div>
                  ))}
                  {clientReservations.length === 0 && (
                    <p className="col-span-full text-center py-8 text-ink/30 italic text-sm">{t('common.noData')}</p>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              {notes && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">{t('clientForm.notes')}</h4>
                  <p className="text-sm text-amber-900/80 leading-relaxed italic">{notes}</p>
                </div>
              )}
            </>
          )
        )}
      </div>
    </BaseModal>
  );
}
