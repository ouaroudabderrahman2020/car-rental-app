import React from 'react';
import { Edit } from 'lucide-react';
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

export default function DetailsModal({ isOpen, onClose, title, sections, onEdit }: DetailsModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
      title={
        <div className="flex justify-between items-center w-full pr-8">
          <div className="flex items-center gap-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-[0.2em]">
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
      <div className="p-1 sm:p-2 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section, sIdx) => (
            <div
              key={sIdx}
              className="bg-slate-50/80 border border-slate-200/85 rounded-xl p-5 sm:p-6 shadow-sm flex-1 min-w-[320px]"
            >
            {section.title && (
              <div className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-slate-900 uppercase pb-3 mb-4 border-b border-slate-200">
                {section.icon && <span className="shrink-0 text-indigo-600">{section.icon}</span>}
                {section.title}
              </div>
            )}

            <div className="flex flex-col gap-0">
              {section.fields.map((field, fIdx) => (
                <div
                  key={fIdx}
                  className="flex items-baseline py-2 border-b border-slate-100 last:border-0 gap-2 w-full min-w-0"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap shrink-0">
                    {field.label} :
                  </span>
                  <span className="text-sm font-semibold text-slate-900 break-words flex-grow min-w-0">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );
}
