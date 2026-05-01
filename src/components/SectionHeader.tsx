import React from 'react';

interface SectionHeaderProps {
  title: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  accentColor?: 'primary' | 'blue';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  badge, 
  actions, 
  className = "",
  accentColor = 'primary'
}) => {
  const accentClass = accentColor === 'blue' ? 'bg-accent-blue' : 'bg-primary';
  const textClass = accentColor === 'blue' ? 'text-accent-blue' : 'text-primary';

  return (
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 v-heading-gap ${className}`}>
      <div className="flex items-center gap-4">
        {/* Visual Accent Bar */}
        <div className={`w-1.5 h-6 ${accentClass} rounded-full`}></div>
        
        <div className="flex items-center gap-3">
          <h2 className={`text-sm md:text-base font-black uppercase tracking-widest ${textClass} m-0`}>
            {title}
          </h2>
          {badge && (
            <div className="flex items-center">
              {badge}
            </div>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
