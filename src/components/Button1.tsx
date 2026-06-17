import React from 'react';

interface Button1Props {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  title?: string;
}

const Button1: React.FC<Button1Props> = ({ 
  children, 
  onClick, 
  disabled, 
  type = 'button', 
  className = '',
  icon,
  title
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        border-2 border-[#24b4fb] bg-[#24b4fb]
        rounded-[0.9em] cursor-pointer
        py-[0.8em] px-[1.2em]
        transition-all duration-200 ease-in-out
        hover:bg-[#0071e2] hover:border-[#0071e2]
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center
        ${className}
      `}
    >
      <span className="flex justify-center items-center gap-2 text-white font-semibold text-base">
        {icon}
        {children}
      </span>
    </button>
  );
};

export default Button1;
