import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Field1Props {
  label: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  name?: string;
  error?: string;
  className?: string;
  children?: React.ReactNode; // For select options
  as?: 'input' | 'select' | 'textarea';
  disabled?: boolean;
  style?: React.CSSProperties;
  required?: boolean;
  min?: string | number;
  max?: string | number;
}

const Field1: React.FC<Field1Props> = ({
  label,
  type = 'text',
  placeholder = 'Write here...',
  value,
  onChange,
  onFocus,
  onBlur,
  onClick,
  name,
  error,
  className = '',
  children,
  as = 'input',
  disabled = false,
  style,
  required,
  min,
  max
}) => {
  const isSelect = as === 'select';
  const isTextarea = as === 'textarea';
  
  const labelRef = useRef<HTMLLabelElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (labelRef.current) {
        const hasOverflow = labelRef.current.scrollWidth > labelRef.current.offsetWidth;
        setIsOverflowing(hasOverflow);
      }
    };

    const resizeObserver = new ResizeObserver(() => checkOverflow());
    if (labelRef.current) {
      resizeObserver.observe(labelRef.current);
    }

    checkOverflow();
    return () => resizeObserver.disconnect();
  }, [label]);

  const handleClick = (e: React.MouseEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (onClick) onClick(e);
    // Auto-trigger native picker for date/time/color inputs if supported
    if (type && ['date', 'datetime-local', 'time', 'month', 'week'].includes(type) && (e.target as any).showPicker) {
      try {
        (e.target as any).showPicker();
      } catch (err) {
        // Fallback for browsers that don't support showPicker yet
        console.debug('showPicker not supported', err);
      }
    }
  };

  return (
    <div className={`flex flex-col w-full relative mt-2 ${className}`} style={style}>
      <label 
        ref={labelRef}
        onMouseEnter={() => isOverflowing && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`absolute -top-2 left-3 px-1 bg-white z-10 text-[0.65rem] text-black font-black uppercase tracking-[0.1em] whitespace-nowrap overflow-hidden transition-all truncate max-w-[90%]
          ${isOverflowing ? 'cursor-help' : ''}
        `}
      >
        {label}
        {required && <span className="text-red-600 font-bold ml-0.5">*</span>}
      </label>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            className="absolute z-[100] left-3 -top-10 px-2 py-1 bg-black text-white text-[9px] rounded font-bold uppercase pointer-events-none whitespace-normal max-w-[200px] shadow-xl border border-white/20"
          >
            {label}
            <div className="absolute top-full left-2 -mt-1 border-4 border-transparent border-t-black" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {isSelect ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={handleClick}
          disabled={disabled}
          className={`
            p-[11px_10px] text-[0.75rem] border-2 border-black rounded-[5px] bg-white font-bold uppercase
            focus:outline-none transition-all
            ${error ? 'ring-2 ring-red-500 border-red-500' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {children}
        </select>
      ) : isTextarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={handleClick}
          disabled={disabled}
          className={`
            p-[11px_10px] text-[0.75rem] border-2 border-black rounded-[5px] bg-white font-bold min-h-[100px]
            focus:outline-none transition-all
            ${error ? 'ring-2 ring-red-500 border-red-500' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={handleClick}
          disabled={disabled}
          min={min}
          max={max}
          className={`
            p-[11px_10px] text-[0.75rem] border-2 border-black rounded-[5px] bg-white font-bold uppercase
            focus:outline-none transition-all
            ${error ? 'ring-2 ring-red-500 border-red-500' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
      )}
      {error && <span className="text-[10px] text-red-500 font-bold mt-1 uppercase">{error}</span>}
    </div>
  );
};

export default Field1;
