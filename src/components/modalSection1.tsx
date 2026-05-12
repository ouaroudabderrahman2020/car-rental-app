import React from 'react';

interface ModalSection1Props {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  extraHeader?: React.ReactNode;
  className?: string;
}

const ModalSection1: React.FC<ModalSection1Props> = ({ 
  title, 
  children, 
  footer, 
  extraHeader, 
  className = "" 
}) => {
  return (
    <div className={`flex-1 w-full min-w-[280px] flex flex-col relative border-[1px] border-black rounded-[12px] bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden ${className}`}>
      <div className="w-full h-16 bg-slate-50 border-b-[1px] border-black px-4 sm:px-6 flex justify-between items-center group gap-2">
        <h3 className="text-[14px] sm:text-[16px] font-black text-black uppercase tracking-tight shrink-0">
          {title}
        </h3>
        {extraHeader}
      </div>
      <div className="px-3 sm:px-4 py-8 flex flex-col gap-6 w-full h-full min-w-0">
        {children}
      </div>
      {footer && (
        <div className="px-3 sm:px-4 pb-8">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ModalSection1;
