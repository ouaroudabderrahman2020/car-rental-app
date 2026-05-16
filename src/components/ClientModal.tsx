import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, Phone, CreditCard, Calendar, Shield, History, 
  Trash2, Check, Edit2, Mail, MapPin, Globe, Loader2,
  Lock, X, Star, AlertCircle, FileText, Upload, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Customer, Reservation } from '../types';
import { useStatus } from '../contexts/StatusContext';
import { useNotification } from '../contexts/NotificationContext';
import BaseModal from './BaseModal';
import { gasService, getFileIdFromUrl, getDrivePreviewUrl } from '../lib/gas';

import ModalSection1 from './modalSection1';

const Label = ({ children, required, className = "" }: { children: React.ReactNode, required?: boolean, className?: string }) => (
  <label className={`text-[10px] font-black uppercase tracking-[0.15em] text-[#0066FF] mb-2 flex items-center gap-1 ${className}`}>
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

const InputField = (props: any) => {
  const { label, required, className, containerClassName = "w-full", ...rest } = props;
  return (
    <div className={`flex flex-col min-w-0 ${containerClassName}`}>
      {label && <Label required={required}>{label}</Label>}
      <input 
        {...rest}
        className={`w-full min-w-0 h-11 bg-white border border-black rounded-[12px] px-5 text-sm font-bold focus:outline-none focus:border-2 focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out disabled:bg-slate-50 disabled:text-black disabled:cursor-default overflow-hidden bg-clip-padding relative z-0 ${className || ''}`}
      />
    </div>
  );
};

const SelectField = (props: any) => {
  const { label, required, children, className, containerClassName = "w-full", ...rest } = props;
  return (
    <div className={`flex flex-col min-w-0 ${containerClassName}`}>
      {label && <Label required={required}>{label}</Label>}
      <select 
        {...rest}
        className={`w-full min-w-0 h-11 bg-white border border-black rounded-[12px] px-5 text-sm font-bold focus:outline-none focus:border-2 focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out disabled:bg-slate-50 disabled:text-black disabled:cursor-default appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat overflow-hidden bg-clip-padding relative z-0 ${className || ''}`}
      >
        {children}
      </select>
    </div>
  );
};

const TextareaField = (props: any) => {
  const { label, required, className, containerClassName = "w-full", ...rest } = props;
  return (
    <div className={`flex flex-col min-w-0 ${containerClassName}`}>
      {label && <Label required={required}>{label}</Label>}
      <textarea 
        {...rest}
        className={`w-full min-w-0 h-24 bg-white border border-black rounded-[12px] px-5 py-4 text-sm font-bold focus:outline-none focus:border-2 focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e] transition-all duration-300 ease-in-out disabled:bg-slate-50 disabled:text-black disabled:cursor-default overflow-hidden bg-clip-padding relative z-0 ${className || ''}`}
      />
    </div>
  );
};

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  client?: Customer | null;
  reservations?: Reservation[];
  onRefresh?: () => void;
  onConfirm?: () => void;
}

const DocSlot = ({ label, file, url, onUpload, onRemove, isEditMode, disabled, className = "" }: any) => {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col gap-2 min-w-0 ${className}`}>
      <Label className="truncate">{label}</Label>
      <div className="flex flex-col gap-3 min-w-0">
        {isEditMode && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,application/pdf';
              input.onchange = (e: any) => onUpload(e);
              input.click();
            }}
            className="h-10 px-6 bg-white border-2 border-black rounded-[12px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none bg-clip-padding relative z-10 shrink-0 w-full"
          >
            {t('clientForm.uploadFile', 'Upload Document')}
            <Upload className="w-3.5 h-3.5" />
          </button>
        )}
        
        {(file || url) && (
          <div className="flex-1 flex items-center justify-between px-4 h-10 bg-emerald-50 border-2 border-emerald-500/20 rounded-[12px] overflow-hidden min-w-0 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[10px] font-black font-mono text-emerald-900 truncate">
                {file ? file.fileName : (url ? t('common.document', 'Document') : '')}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {url && (
                <button
                  type="button"
                  onClick={() => window.open(getDrivePreviewUrl(url), '_blank')}
                  className="p-1.5 hover:bg-emerald-100/50 rounded text-emerald-600 transition-colors"
                  title={t('common.viewPdf', 'View PDF')}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
              {isEditMode && !disabled && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="p-1.5 hover:bg-red-100 rounded text-red-500 transition-colors"
                  title={t('common.remove', 'Remove')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ClientModal({ isOpen, onClose, mode, client, reservations = [], onRefresh, onConfirm }: ClientModalProps) {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  const { showToast, confirm: customConfirm } = useNotification();
  
  const [isEditMode, setIsEditMode] = useState(mode === 'add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequiredError, setShowRequiredError] = useState(false);
  
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
  const [trustRank, setTrustRank] = useState('0');
  const [notes, setNotes] = useState('');
  const [isBlacklisted, setIsBlacklisted] = useState(false);

  // Doc State
  const [idDocUrl, setIdDocUrl] = useState('');
  const [idDocFile, setIdDocFile] = useState<{ base64: string; fileName: string; contentType: string } | null>(null);
  
  const [licenseDocUrl, setLicenseDocUrl] = useState('');
  const [licenseDocFile, setLicenseDocFile] = useState<{ base64: string; fileName: string; contentType: string } | null>(null);
  
  const [masterDocUrl, setMasterDocUrl] = useState('');
  const [masterDocFile, setMasterDocFile] = useState<{ base64: string; fileName: string; contentType: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setShowRequiredError(false);
      
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
        setTrustRank(client.trust_rank?.toString() || '0');
        setNotes(client.notes || '');
        setIsBlacklisted(client.is_blacklisted || false);
        setIdDocUrl(client.drive_id_photo || '');
        setLicenseDocUrl(client.drive_license_front_photo || '');
        setMasterDocUrl(client.drive_contract_doc_id || '');
        setIdDocFile(null);
        setLicenseDocFile(null);
        setMasterDocFile(null);
        setIsEditMode(false);
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
        setTrustRank('0');
        setNotes('');
        setIsBlacklisted(false);
        setIdDocUrl('');
        setLicenseDocUrl('');
        setMasterDocUrl('');
        setIdDocFile(null);
        setLicenseDocFile(null);
        setMasterDocFile(null);
        setIsEditMode(true);
      }
    }
  }, [client, isOpen, mode]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'license' | 'master') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const filePayload = {
        base64,
        fileName: file.name,
        contentType: file.type
      };

      if (type === 'id') setIdDocFile(filePayload);
      if (type === 'license') setLicenseDocFile(filePayload);
      if (type === 'master') setMasterDocFile(filePayload);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name || !nationalId || !licenseNumber) {
      setShowRequiredError(true);
      showToast(t('clientForm.fillRequiredFields', 'Please fill all required fields'), 'error');
      return;
    }

    setIsSubmitting(true);
    setStatus(t('common.processing', 'Processing...'), 'processing', 0);
    
    try {
      let finalIdDocUrl = idDocUrl;
      let finalLicenseDocUrl = licenseDocUrl;
      let finalMasterDocUrl = masterDocUrl;

      const folderName = `${name} ${nationalId}`.trim();
      let oldFolderName: string | undefined = undefined;

      if (mode === 'edit' && client) {
        oldFolderName = `${client.name} ${client.national_id || client.id_card_number || ''}`.trim();
        
        // If identity changed BUT no file is uploaded, we should still rename the folder
        if (oldFolderName !== folderName && !idDocFile && !licenseDocFile && !masterDocFile) {
          await gasService.renameClientFolder(oldFolderName, folderName);
        }
      }

      // Upload ID Doc
      if (idDocFile) {
        setStatus(t('common.processing', 'Processing...'), 'processing');
        const oldId = getFileIdFromUrl(client?.drive_id_photo) || undefined;
        const res = await gasService.uploadClientFile({
          ...idDocFile,
          clientFolderName: folderName,
          oldClientFolderName: oldFolderName,
          oldFileId: oldId
        });
        if (res.status === 'success' && res.data.url) {
          finalIdDocUrl = res.data.url;
          setIdDocUrl(res.data.url);
          setIdDocFile(null);
        }
      }

      // Upload License Doc
      if (licenseDocFile) {
        setStatus(t('common.processing', 'Processing...'), 'processing');
        const oldId = getFileIdFromUrl(client?.drive_license_front_photo) || undefined;
        const res = await gasService.uploadClientFile({
          ...licenseDocFile,
          clientFolderName: folderName,
          oldClientFolderName: oldFolderName,
          oldFileId: oldId
        });
        if (res.status === 'success' && res.data.url) {
          finalLicenseDocUrl = res.data.url;
          setLicenseDocUrl(res.data.url);
          setLicenseDocFile(null);
        }
      }

      // Upload Master Doc
      if (masterDocFile) {
        setStatus(t('common.processing', 'Processing...'), 'processing');
        const oldId = getFileIdFromUrl(client?.drive_contract_doc_id) || undefined;
        const res = await gasService.uploadClientFile({
          ...masterDocFile,
          clientFolderName: folderName,
          oldClientFolderName: oldFolderName,
          oldFileId: oldId
        });
        if (res.status === 'success' && res.data.url) {
          finalMasterDocUrl = res.data.url;
          setMasterDocUrl(res.data.url);
          setMasterDocFile(null);
        }
      }

      const payload = {
        name,
        national_id: nationalId,
        dob: dob || null,
        nationality,
        license_number: licenseNumber,
        license_expiry: licenseExpiry || null,
        license_issue: licenseIssue || null,
        phone,
        email,
        address,
        trust_rank: parseInt(trustRank) || 0,
        notes,
        is_blacklisted: isBlacklisted,
        drive_id_photo: finalIdDocUrl,
        drive_license_front_photo: finalLicenseDocUrl,
        drive_contract_doc_id: finalMasterDocUrl
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
      
      setStatus(t('common.actionCompleted', 'Action Completed'), 'success');
      showToast(t('common.success', 'Success'), 'success');
      if (onRefresh) onRefresh();
      onConfirm?.();
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setStatus(`${t('common.error', 'Error')}: ${err.message || ''}`, 'error');
      showToast(err.message || t('common.error', 'Error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!client?.id) return;
    
    const confirmed = await customConfirm({
      title: t('crm.modal.delete', 'Delete Client'),
      message: t('common.confirmation', 'Are you sure you want to proceed?'),
      confirmLabel: t('common.remove', 'Remove'),
      cancelLabel: t('common.cancel', 'Cancel'),
      type: 'danger'
    });

    if (confirmed) {
      setIsSubmitting(true);
      setStatus(t('common.processing', 'Processing...'), 'processing', 0);
      try {
        const folderName = `${client.name} ${client.national_id || client.id_card_number || ''}`.trim();
        await gasService.deleteClientFolder(folderName).catch(() => {});

        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', client.id);
        
        if (error) throw error;
        setStatus(t('common.actionCompleted', 'Action Completed'), 'success');
        showToast(t('common.dataDeleted', 'Data deleted successfully'), 'success');
        if (onRefresh) onRefresh();
        onClose();
      } catch (err: any) {
        console.error('Delete error:', err);
        setStatus(`${t('common.error', 'Error')}`, 'error');
        showToast(t('common.error', 'Error'), 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const clientReservations = client ? reservations
    .filter(r => r.customer_phone === client.phone)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()) : [];

  const isLicenseExpiredCheck = licenseExpiry ? new Date(licenseExpiry) < new Date() : false;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      maxWidth="max-w-[1300px]"
      title={
        <div className="flex items-center justify-between w-full h-full pr-12 transition-all">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-[12px] border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${isBlacklisted ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
              {isBlacklisted ? <AlertCircle className="w-6 h-6 text-red-600" /> : <User className="w-6 h-6 text-blue-600" />}
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-3">
                {mode === 'add' ? t('clientForm.addTitle', 'Add New Client') : (isEditMode ? t('crm.modal.edit', 'Edit Client Profile') : t('crm.modal.title', 'Client Profile'))}
                {isBlacklisted && <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest border border-black rounded-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">{t('crm.modal.blacklisted', 'Blacklisted')}</span>}
              </h2>
              {mode === 'edit' && client && (
                <span className="text-[10px] font-mono font-bold text-black/40 uppercase tracking-widest">
                  ID: {client.id.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
          
          {mode === 'edit' && !isEditMode && (
            <button 
              onClick={() => setIsEditMode(true)}
              className="h-10 px-8 bg-white border-2 border-black rounded-[12px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {t('crm.modal.edit', 'Edit Profile')}
            </button>
          )}
        </div>
      }
    >
      <div className="bg-slate-50/50 w-full py-4 sm:py-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 px-4 sm:px-10 w-full min-w-0">
        <ModalSection1 title={t('clientForm.identity', 'Identity')} className="max-w-none xl:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <InputField 
              label={t('clientForm.fullName', 'Full Name')} 
              value={name} 
              required
              onChange={(e: any) => setName(e.target.value)} 
              disabled={!isEditMode || isSubmitting} 
              containerClassName="sm:col-span-2 lg:col-span-1 xl:col-span-2"
            />
            <InputField 
              label={t('clientForm.nationalId', 'National ID')} 
              value={nationalId} 
              required
              onChange={(e: any) => setNationalId(e.target.value)} 
              disabled={!isEditMode || isSubmitting} 
            />
            <InputField 
              label={t('clientForm.phone', 'Phone')} 
              value={phone} 
              onChange={(e: any) => setPhone(e.target.value)} 
              disabled={!isEditMode || isSubmitting} 
            />
            <InputField 
              label={t('clientForm.licenseNumber', 'License Number')} 
              value={licenseNumber} 
              required
              onChange={(e: any) => setLicenseNumber(e.target.value)} 
              disabled={!isEditMode || isSubmitting} 
            />
            <InputField 
              label={t('clientForm.dob', 'Date of Birth')} 
              type="date" 
              value={dob} 
              onChange={(e: any) => setDob(e.target.value)} 
              disabled={!isEditMode || isSubmitting} 
            />
          </div>
        </ModalSection1>

        <ModalSection1 title={t('clientForm.documents', 'Documents')} className="max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DocSlot 
              label={t('clientForm.idCardDoc', 'ID Card')}
              file={idDocFile}
              url={idDocUrl}
              onUpload={(e: any) => handleFileSelect(e, 'id')}
              onRemove={() => { setIdDocFile(null); setIdDocUrl(''); }}
              isEditMode={isEditMode}
              disabled={isSubmitting}
            />
            <DocSlot 
              label={t('clientForm.licenseDoc', 'Driving License')}
              file={licenseDocFile}
              url={licenseDocUrl}
              onUpload={(e: any) => handleFileSelect(e, 'license')}
              onRemove={() => { setLicenseDocFile(null); setLicenseDocUrl(''); }}
              isEditMode={isEditMode}
              disabled={isSubmitting}
            />
            <DocSlot 
              label={t('clientForm.allInOneDoc', 'Master Contract/Composite')}
              file={masterDocFile}
              url={masterDocUrl}
              onUpload={(e: any) => handleFileSelect(e, 'master')}
              onRemove={() => { setMasterDocFile(null); setMasterDocUrl(''); }}
              isEditMode={isEditMode}
              disabled={isSubmitting}
              className="sm:col-span-2"
            />
          </div>
        </ModalSection1>

        <ModalSection1 title={t('clientForm.otherDetails', 'Other Details')} className="max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InputField 
              label={t('clientForm.licenseExpiry', 'License Expiry')} 
              type="date" 
              value={licenseExpiry} 
              onChange={(e: any) => setLicenseExpiry(e.target.value)} 
              disabled={!isEditMode || isSubmitting}
              className={isLicenseExpiredCheck && !isEditMode ? 'text-red-500 font-black' : ''}
            />
            <InputField 
              label={t('clientForm.licenseIssue', 'License Issue Date')} 
              type="date" 
              value={licenseIssue} 
              onChange={(e: any) => setLicenseIssue(e.target.value)} 
              disabled={!isEditMode || isSubmitting} 
            />
            <InputField 
              label={t('clientForm.email', 'Email Address')} 
              type="email" 
              value={email} 
              onChange={(e: any) => setEmail(e.target.value)} 
              disabled={!isEditMode || isSubmitting} 
            />
            <InputField 
              label={t('clientForm.address', 'Residential Address')} 
              value={address} 
              onChange={(e: any) => setAddress(e.target.value)} 
              disabled={!isEditMode || isSubmitting} 
            />
          </div>
        </ModalSection1>

        <ModalSection1 title={t('clientForm.notesAndRating', 'Notes & Rating')} className="max-w-none xl:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex flex-col">
                <Label>{t('clientForm.rating', 'Trust Ranking')}</Label>
                <div className="flex gap-2.5 mt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={!isEditMode || isSubmitting}
                      onClick={() => setTrustRank(num.toString())}
                      className={`w-11 h-11 rounded-[12px] border-2 border-black flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none ${
                        parseInt(trustRank) >= num 
                          ? 'bg-amber-400 text-black' 
                          : 'bg-white text-black/20'
                      } disabled:cursor-default disabled:shadow-none`}
                    >
                      <Star className={`w-5 h-5 ${parseInt(trustRank) >= num ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              
              {mode === 'edit' && (
                <div className="flex items-center gap-3 p-4 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-[12px]">
                  <input 
                    type="checkbox" 
                    id="blacklist-check"
                    checked={isBlacklisted}
                    disabled={!isEditMode || isSubmitting}
                    onChange={(e) => setIsBlacklisted(e.target.checked)}
                    className="w-5 h-5 border-2 border-black rounded text-red-600 focus:ring-0 cursor-pointer disabled:cursor-default"
                  />
                  <label htmlFor="blacklist-check" className="font-black uppercase tracking-[0.1em] text-[10px] text-red-600 cursor-pointer">
                    {t('crm.modal.markAsBlacklisted', 'Mark as Blacklisted')}
                  </label>
                </div>
              )}
            </div>

            <TextareaField 
              label={t('clientForm.notes', 'Observations')}
              value={notes} 
              onChange={(e: any) => setNotes(e.target.value)} 
              disabled={!isEditMode || isSubmitting}
              placeholder={t('common.notesPlaceholder', 'Type any relevant observations or notes...')}
              className="h-full min-h-[140px]"
            />
          </div>
        </ModalSection1>

        {mode === 'edit' && !isEditMode && (
          <ModalSection1 title={t('crm.modal.bookingHistory', 'Recent Booking History')} className="max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientReservations.length > 0 ? (
                clientReservations.slice(0, 6).map((res) => (
                  <div key={res.id} className="bg-white border-2 border-black rounded-[12px] p-5 transition-all hover:bg-blue-50/50 group isolation-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-black text-black text-[12px] uppercase tracking-tight">{res.car?.brand} {res.car?.model}</p>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-black rounded-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                        res.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        res.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-600 text-white'
                      }`}>
                        {res.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-black/40 mb-3 uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5" />
                      {res.start_date.split('T')[0]} → {res.end_date.split('T')[0]}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <p className="font-black text-black text-base uppercase tracking-tighter">{res.total_price.toFixed(0)} <span className="text-[10px] opacity-40">MAD</span></p>
                      <span className="text-[9px] font-black text-black/20 uppercase tracking-widest">#{res.id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center grayscale opacity-30 border-2 border-black border-dashed rounded-[12px] bg-slate-50/50">
                  <History className="w-12 h-12 mb-3 text-black/40" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('common.noData', 'No historical data found')}</p>
                </div>
              )}
            </div>
          </ModalSection1>
        )}
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-4 px-4 sm:px-10 pt-8">
          <div className="flex items-center gap-3">
            {mode === 'edit' && !isEditMode && (
              <button 
                onClick={handleDelete}
                className="w-12 h-12 bg-white border-2 border-red-500 rounded-[12px] flex items-center justify-center text-red-500 hover:bg-red-50 transition-all shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] active:translate-y-[1px] active:shadow-none disabled:opacity-50 overflow-hidden bg-clip-padding"
                disabled={isSubmitting}
                title={t('crm.modal.delete', 'Delete')}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-40 h-12 px-8 bg-white border-2 border-black rounded-[12px] text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-clip-padding"
            >
              {isEditMode ? t('common.cancel', 'Cancel') : t('crm.modal.close', 'Close')}
            </button>
          </div>

          {isEditMode && (
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {showRequiredError && (
                  <motion.span 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 font-black text-[10px] uppercase tracking-widest whitespace-nowrap"
                  >
                    {t('clientForm.fillRequiredFields', 'Please fill all required fields')}
                  </motion.span>
                )}
              </AnimatePresence>
              
              <button 
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full sm:w-48 h-12 bg-blue-600 border-2 border-black rounded-[12px] text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none disabled:bg-slate-400 disabled:border-slate-400 disabled:shadow-none overflow-hidden bg-clip-padding"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {isSubmitting ? t('common.processing', 'Processing...') : (mode === 'add' ? t('clientForm.confirm', 'Confirm') : t('common.save', 'Save Changes'))}
              </button>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
