import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children, className = '', style }) => {
  return (
    <div className={`flex flex-col mb-12 relative border-2 border-black rounded-t-[12px] rounded-b-[6px] bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`} style={style}>
      <div className="w-full bg-slate-50 border-b-2 border-black py-2.5 px-6 sm:px-8 flex items-center group">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 group-hover:text-black transition-colors duration-300">
          {title}
        </span>
      </div>
      <div className="px-6 sm:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FormSection;
