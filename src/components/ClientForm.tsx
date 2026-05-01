import React from 'react';
import { useTranslation } from 'react-i18next';
import Field1 from './Field1';
import FormSection from './FormSection';

interface ClientFormProps {
  name: string; setName: (val: string) => void;
  nationalId: string; setNationalId: (val: string) => void;
  dob: string; setDob: (val: string) => void;
  nationality: string; setNationality: (val: string) => void;
  licenseNumber: string; setLicenseNumber: (val: string) => void;
  licenseExpiry: string; setLicenseExpiry: (val: string) => void;
  licenseIssue: string; setLicenseIssue: (val: string) => void;
  phone: string; setPhone: (val: string) => void;
  email: string; setEmail: (val: string) => void;
  address: string; setAddress: (val: string) => void;
  rating: string; setRating: (val: string) => void;
  notes: string; setNotes: (val: string) => void;
  disabled?: boolean;
}

export default function ClientForm({
  name, setName, nationalId, setNationalId, dob, setDob, nationality, setNationality,
  licenseNumber, setLicenseNumber, licenseExpiry, setLicenseExpiry, licenseIssue, setLicenseIssue,
  phone, setPhone, email, setEmail, address, setAddress, rating, setRating, notes, setNotes, disabled
}: ClientFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 bg-white p-6">
      <FormSection title={t('clientForm.identity', 'Identity')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field1 label={t('clientForm.fullName', 'Full Name')} value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} />
          <Field1 label={t('clientForm.nationalId', 'National ID / Passport')} value={nationalId} onChange={(e) => setNationalId(e.target.value)} disabled={disabled} />
          <Field1 label={t('clientForm.dob', 'Date of Birth')} type="date" value={dob} onChange={(e) => setDob(e.target.value)} disabled={disabled} />
          <Field1 label={t('clientForm.nationality', 'Nationality')} value={nationality} onChange={(e) => setNationality(e.target.value)} disabled={disabled} />
        </div>
      </FormSection>

      <FormSection title={t('clientForm.credentials', 'Driving Credentials')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field1 label={t('clientForm.licenseNumber', 'License Number')} value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} disabled={disabled} />
          <Field1 label={t('clientForm.licenseExpiry', 'License Expiry')} type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} disabled={disabled} />
          <Field1 label={t('clientForm.licenseIssue', 'License Issue')} type="date" value={licenseIssue} onChange={(e) => setLicenseIssue(e.target.value)} disabled={disabled} />
        </div>
      </FormSection>

      <FormSection title={t('clientForm.contact', 'Contact & Verification')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field1 label={t('clientForm.phone', 'Phone Number')} value={phone} onChange={(e) => setPhone(e.target.value)} disabled={disabled} />
          <Field1 label={t('clientForm.email', 'Email Address')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={disabled} />
          <div className="md:col-span-2">
            <Field1 label={t('clientForm.address', 'Physical Address')} value={address} onChange={(e) => setAddress(e.target.value)} disabled={disabled} />
          </div>
        </div>
      </FormSection>

      <FormSection title={t('clientForm.trust', 'Trust & Rating')}>
        <div className="space-y-4">
          <Field1 label={t('clientForm.rating', 'Rating (1-5 Stars)')} type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} disabled={disabled} />
          <Field1 as="textarea" label={t('clientForm.notes', 'Internal Notes')} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={disabled} />
        </div>
      </FormSection>
      
      {/* Documentation section is a placeholder for actual upload/canvas, simplified for now based on requirements */}
    </div>
  );
}
