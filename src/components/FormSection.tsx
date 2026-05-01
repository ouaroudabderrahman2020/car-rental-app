import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children, className = '', style }) => {
  return (
    <div className={`relative border-2 border-black bg-[#E8EBF7] rounded-[5px] p-6 mb-8 ${className}`} style={style}>
      <div className="absolute top-0 -translate-y-1/2 left-4 p-1.5 bg-white border-2 border-black rounded-[4px] z-10 flex items-center justify-center min-w-[32px]">
        <span className="text-[10px] font-black uppercase tracking-widest text-black leading-none text-center">
          {title}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-4">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
