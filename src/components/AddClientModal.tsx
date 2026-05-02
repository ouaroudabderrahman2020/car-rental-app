import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import Modal1 from './Modal1';
import Button1 from './Button1';
import ClientForm from './ClientForm';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (client: any) => void;
}

export default function AddClientModal({ isOpen, onClose, onConfirm }: AddClientModalProps) {
  const { t } = useTranslation();
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !phone) {
      alert(t('common.requiredFields', 'Name and Phone are required.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name,
          national_id: nationalId,
          id_card_number: nationalId, // mapping both for compatibility
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
          is_blacklisted: false,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      onConfirm(data![0]);
      onClose();
      // Reset fields
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
    } catch (err: any) {
      console.error('Error adding client:', err);
      alert(`${t('common.error', 'An error occurred')}: ${err.message || ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal1 isOpen={isOpen} onClose={onClose} toolName={t('clientForm.addTitle', 'Add New Client')}>
      <div className="max-h-[70vh] overflow-y-auto">
        <ClientForm 
          name={name} setName={setName}
          nationalId={nationalId} setNationalId={setNationalId}
          dob={dob} setDob={setDob}
          nationality={nationality} setNationality={setNationality}
          licenseNumber={licenseNumber} setLicenseNumber={setLicenseNumber}
          licenseExpiry={licenseExpiry} setLicenseExpiry={setLicenseExpiry}
          licenseIssue={licenseIssue} setLicenseIssue={setLicenseIssue}
          phone={phone} setPhone={setPhone}
          email={email} setEmail={setEmail}
          address={address} setAddress={setAddress}
          rating={rating} setRating={setRating}
          notes={notes} setNotes={setNotes}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex gap-4 p-6 border-t border-slate-200">
        <Button1 onClick={onClose} className="bg-slate-100 text-slate-800" disabled={isSubmitting}>{t('common.cancel', 'Cancel')}</Button1>
        <Button1 onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? t('common.saving', 'Saving...') : t('common.confirm', 'Confirm')}
        </Button1>
      </div>
    </Modal1>
  );
}
