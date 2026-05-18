import React from 'react';
import BaseModal from './BaseModal';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: {
    title: string;
    icon?: React.ReactNode;
    fields: { label: string; value: React.ReactNode }[];
  }[];
  onEdit?: () => void;
}

import { Edit } from 'lucide-react';

export default function DetailsModal({ isOpen, onClose, title, sections, onEdit }: DetailsModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title={
        <div className="flex justify-between items-center w-full pr-8">
          <div className="flex items-center gap-3">
            <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-[0.2em]">
              {title}
            </h2>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-blue-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
        </div>
      }
    >
      <div className="px-5 sm:px-6 py-6 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
        {sections.map((section, sIdx) => (
          <div
            key={sIdx}
            className="bg-amber-50/95 border border-amber-200/80 rounded-xl p-5 sm:p-6 shadow-sm mb-4 last:mb-0"
          >
            {section.title && (
              <div className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-amber-900 uppercase pb-3 mb-4 border-b border-amber-900/10">
                {section.icon && <span className="shrink-0">{section.icon}</span>}
                {section.title}
              </div>
            )}

            <div className="flex flex-col gap-0">
              {section.fields.map((field, fIdx) => (
                <div
                  key={fIdx}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-0 py-2.5 border-b border-amber-900/5 last:border-0"
                >
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 sm:min-w-[140px] sm:pr-3 shrink-0">
                    {field.label}
                  </span>
                  <span className="text-sm font-semibold text-amber-950/90 sm:before:hidden before:content-[':_'] before:mr-1">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}
