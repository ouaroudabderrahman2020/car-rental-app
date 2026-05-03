import React, { ReactNode } from 'react';

interface Section2Props {
  /** The section header text */
  title?: string;
  /** Content to be rendered inside the section */
  children: ReactNode;
  /** Optional extra Tailwind classes for the outer container */
  className?: string;
}

/**
 * Section2 Component
 * - Premium "Display" typography: Sharp, Black, and Thick.
 * - Crispy border with high-visibility depth.
 */
export const Section2: React.FC<Section2Props> = ({ 
  title, 
  children, 
  className = "" 
}) => {
  return (
    <section 
      className={`
        relative 
        w-full
        
        /* Background: White base with a very subtle slate tint at the bottom */
        bg-white
        bg-gradient-to-br from-white to-slate-50/40
        
        /* Crispy Border & Ring: Double-layered for high definition */
        border border-slate-300/80
        ring-1 ring-slate-900/[0.03]
        
        /* Depth: Multi-layered elevation shadows */
        shadow-[0_2px_4px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)]
        
        rounded-xl
        p-6 
        transition-all 
        duration-300
        hover:shadow-xl hover:shadow-slate-200/50
        hover:border-slate-400/60
        ${className}
      `}
    >
      {/* "Display" Title Style: Sharp, Black, and Smooth */}
      {title && (
        <h2 className="text-xl font-black tracking-tighter text-black antialiased mb-5 leading-none uppercase">
          {title}
        </h2>
      )}

      {/* Content Area */}
      <div className="text-slate-800 text-sm leading-relaxed relative z-10">
        {children}
      </div>
    </section>
  );
};

export default Section2;
