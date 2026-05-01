import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface NavItem {
  name: string;
  path: string;
}

interface NavigationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  formatHeaderClock: (date: Date) => string;
  verifiedTime: Date;
}

export const NavigationOverlay: React.FC<NavigationOverlayProps> = ({
  isOpen,
  onClose,
  navItems,
  formatHeaderClock,
  verifiedTime,
}) => {
  const { i18n } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] bg-white flex flex-col px-4 md:px-margin overflow-y-auto"
        >
          {/* Top spacer to match header height and keep the button area clear */}
          <div className="flex items-center justify-between h-14 mb-12 shrink-0">
            <div className="text-2xl font-black tracking-tighter text-ink">
              RentalCore
            </div>
            {/* The actual button is rendered by Layout.tsx at z-110 to ensure it stays stationary */}
            <div className="w-10 h-10 lg:hidden" /> 
          </div>

          <nav className="flex flex-col gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => 
                  `text-4xl md:text-5xl font-black uppercase tracking-tighter transition-all ${
                    isActive ? 'text-primary' : 'text-ink/60 hover:text-ink'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-16 border-t border-slate-100 flex flex-col gap-6">
            <div className="flex items-center justify-between text-ink/60">
              <span className="text-sm font-bold uppercase tracking-widest">Language</span>
              <div className="flex gap-4">
                <button onClick={() => i18n.changeLanguage('en')} className={`text-xs font-black p-2 ${i18n.language.startsWith('en') ? 'text-primary' : 'text-ink'}`}>EN</button>
                <button onClick={() => i18n.changeLanguage('fr')} className={`text-xs font-black p-2 ${i18n.language.startsWith('fr') ? 'text-primary' : 'text-ink'}`}>FR</button>
                <button onClick={() => i18n.changeLanguage('ar')} className={`text-xs font-black p-2 ${i18n.language.startsWith('ar') ? 'text-primary' : 'text-ink'}`}>AR</button>
              </div>
            </div>
            <div className="text-ink/40 text-xs font-medium pb-8 uppercase tracking-[0.2em]">
              {formatHeaderClock(verifiedTime)}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
  iconClassName?: string;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  isOpen,
  onClick,
  className = "",
  iconClassName = "w-6 h-6",
}) => {
  return (
    <button 
      onClick={onClick}
      className={`transition-colors relative ${className}`}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <Menu className={iconClassName} />
    </button>
  );
};
