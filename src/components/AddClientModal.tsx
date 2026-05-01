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

  const handleSubmit = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name,
          national_id: nationalId,
          dob,
          nationality,
          license_number: licenseNumber,
          license_expiry: licenseExpiry,
          license_issue: licenseIssue,
          phone,
          email,
          address,
          trust_rank: parseInt(rating),
          notes
        }])
        .select();

      if (error) throw error;
      
      onConfirm(data![0]);
      onClose();
    } catch (err) {
      console.error('Error adding client:', err);
    }
  };

  return (
    <Modal1 isOpen={isOpen} onClose={onClose} toolName={t('clientForm.addTitle', 'Add New Client')}>
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
      />
      <div className="flex gap-4 p-6 border-t border-slate-200">
        <Button1 onClick={onClose} className="bg-slate-100 text-slate-800">{t('common.cancel', 'Cancel')}</Button1>
        <Button1 onClick={handleSubmit}>{t('common.confirm', 'Confirm')}</Button1>
      </div>
    </Modal1>
  );
}
