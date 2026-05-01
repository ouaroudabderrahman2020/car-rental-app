import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal1 from './Modal1';
import Button1 from './Button1';
import ClientForm from './ClientForm';
import { Customer } from '../types';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Customer | null;
}

export default function ClientDetailsModal({ isOpen, onClose, client }: ClientDetailsModalProps) {
  const { t } = useTranslation();
  if (!client) return null;

  return (
    <Modal1 isOpen={isOpen} onClose={onClose} toolName={t('clientDetails.title', 'Client Details')}>
      <ClientForm 
        name={client.name} setName={() => {}}
        nationalId={client.id_card_number} setNationalId={() => {}}
        dob="" setDob={() => {}}
        nationality="" setNationality={() => {}}
        licenseNumber={client.license_number} setLicenseNumber={() => {}}
        licenseExpiry={client.license_expiry} setLicenseExpiry={() => {}}
        licenseIssue="" setLicenseIssue={() => {}}
        phone={client.phone} setPhone={() => {}}
        email={client.email} setEmail={() => {}}
        address="" setAddress={() => {}}
        rating={client.trust_rank.toString()} setRating={() => {}}
        notes="" setNotes={() => {}}
        disabled={true}
      />
      <div className="flex gap-4 p-6 border-t border-slate-200">
        <Button1 onClick={onClose} className="bg-slate-100 text-slate-800">{t('common.close', 'Close')}</Button1>
      </div>
    </Modal1>
  );
}
