import React, { useState } from 'react';
import { X, Plus, Check, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

const Label = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#0066FF] mb-2 flex items-center gap-1">
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

interface ItemSectionProps {
  items: string[];
  onChange: (items: string[]) => void;
  isEdit?: boolean;
  isEditLocked?: boolean;
  disabled?: boolean;
}

const DEFAULT_EQUIPMENT_KEYS = ['vest', 'triangle', 'extinguisher', 'tire', 'jack', 'wrench'];

const EQUIPMENT_IMAGES: Record<string, string> = {
  vest: 'assets/equipments/vest.jpg',
  triangle: 'assets/equipments/triangle.jpg',
  extinguisher: 'assets/equipments/extinguisher.jpg',
  tire: 'assets/equipments/tire.jpg',
  jack: 'assets/equipments/jack.jpg',
  wrench: 'assets/equipments/wrench.jpg',
};

export const ItemSection: React.FC<ItemSectionProps> = ({ 
  items, 
  onChange, 
  isEdit, 
  isEditLocked,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleRemoveItem = (itemToRemove: string) => {
    onChange(items.filter(i => i !== itemToRemove));
  };

  const handleToggleItem = (itemName: string) => {
    if (items.includes(itemName)) {
      onChange(items.filter(i => i !== itemName));
    } else {
      onChange([...items, itemName]);
    }
  };

  const handleAddItem = () => {
    if (newItemName.trim()) {
      if (!items.some(i => i.toLowerCase() === newItemName.trim().toLowerCase())) {
        onChange([...items, newItemName.trim()]);
      }
      setNewItemName('');
    }
  };

  const getEquipmentLabel = (key: string) => {
    return t(`reservations.form.includedItemsList.${key}`, { 
      defaultValue: key === 'vest' ? 'Safety Vest' : 
                   key === 'triangle' ? 'Warning Triangle' : 
                   key === 'extinguisher' ? 'Fire Extinguisher' : 
                   key === 'tire' ? 'Spare Tire' : 
                   key === 'jack' ? 'Car Jack' : 
                   key === 'wrench' ? 'Lug Wrench' : key 
    });
  };

  const getEquipmentImage = (item: string) => {
    const name = item.toLowerCase();
    
    // Find matching local asset key
    const matchedKey = DEFAULT_EQUIPMENT_KEYS.find(key => name.includes(key));
    
    if (matchedKey) {
      return EQUIPMENT_IMAGES[matchedKey];
    }

    // Default unique shape for custom items if no local asset matches
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  const isDefaultItem = (item: string) => {
    return DEFAULT_EQUIPMENT_KEYS.some(k => {
      const translated = getEquipmentLabel(k);
      return translated.toLowerCase() === item.toLowerCase();
    });
  };

  return (
    <div className="space-y-4 w-full">
      <Label>{t('reservations.form.includedItems', 'Included Items')}</Label>
      <div className="grid grid-cols-2 gap-3 min-h-[40px]">
        {/* Render Default Items first (Always visible) */}
        {DEFAULT_EQUIPMENT_KEYS.map((key) => {
          const label = getEquipmentLabel(key);
          const isSelected = items.some(i => i.toLowerCase() === label.toLowerCase());
          const image = EQUIPMENT_IMAGES[key];
          
          return (
            <button 
              key={key} 
              type="button"
              disabled={disabled || (isEdit && isEditLocked)}
              onClick={() => handleToggleItem(label)}
              className={`flex items-center gap-2 p-1.5 border-[1px] rounded-[12px] group transition-all text-left min-w-0 ${
                isSelected 
                  ? 'bg-blue-50 border-blue-600 shadow-[1.5px_1.5px_0px_0px_rgba(37,99,235,1)] hover:shadow-[3px_3px_0px_0px_rgba(37,99,235,1)]' 
                  : 'bg-white border-black shadow-none'
              } active:translate-y-[1px] active:shadow-none disabled:opacity-50`}
            >
              <div className="w-9 h-9 rounded-[6px] overflow-hidden bg-slate-50 flex-shrink-0 border-[1px] border-black/5 flex items-center justify-center relative">
                <img 
                  src={image} 
                  alt={label} 
                  className={`w-full h-full object-cover transition-all ${isSelected ? 'scale-110' : 'opacity-80'}`}
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex-1 flex flex-col min-w-0">
                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.05em] truncate ${isSelected ? 'text-blue-900' : 'text-black/60'}`}>
                  {label}
                </span>
                <span className={`text-[7px] font-bold uppercase tracking-tight mt-0.5 truncate ${isSelected ? 'text-blue-600/50' : 'text-black/20'}`}>
                  {t('reservations.item.standard', 'Standard')}
                </span>
              </div>
            </button>
          );
        })}

        {/* Render Custom Items (items that are NOT in defaults) */}
        {items.filter(i => !isDefaultItem(i)).map((item) => {
          const image = getEquipmentImage(item);
          return (
            <div 
              key={item} 
              className="flex items-center gap-2 bg-emerald-50 p-1.5 border-[1px] border-emerald-600 rounded-[12px] group transition-all shadow-[1.5px_1.5px_0px_0px_rgba(5,150,105,1)] min-w-0"
            >
              <div className="w-9 h-9 rounded-[6px] overflow-hidden bg-white flex-shrink-0 border-[1px] border-emerald-600/20 flex items-center justify-center">
                <img 
                  src={image} 
                  alt={item} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('dicebear')) {
                      target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                    }
                  }}
                />
              </div>
              
              <div className="flex-1 flex flex-col min-w-0">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.05em] text-emerald-900 truncate">
                  {item}
                </span>
                <span className="text-[7px] font-bold text-emerald-600/50 uppercase tracking-tight mt-0.5 truncate">
                  {t('reservations.item.custom', 'Add-on')}
                </span>
              </div>

              {!disabled && !(isEdit && isEditLocked) && (
                <button 
                  onClick={() => handleRemoveItem(item)}
                  className="text-emerald-700 p-1 rounded-[8px] hover:bg-emerald-100 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Custom Item Button */}
        {!disabled && !(isEdit && isEditLocked) && !isAddingItem && (
          <button 
            onClick={() => setIsAddingItem(true)}
            className="h-12 px-4 bg-slate-50 border-[1px] border-dashed border-black/10 rounded-[12px] flex flex-col items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all hover:border-black/20 group"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 transition-transform group-hover:scale-110" /> 
            {t('common.add', 'Add Custom')}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAddingItem && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="flex flex-col gap-3 p-3 bg-white border-[1px] border-black rounded-[16px] shadow-2xl relative z-10 w-full"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-black/60">
                {t('reservations.form.addCustomItem', 'Add Custom Item')}
              </span>
              <button onClick={() => setIsAddingItem(false)} className="text-black/20 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input 
                className="flex-1 h-10 bg-slate-50 border-[1px] border-black/5 rounded-[12px] px-3 text-[10px] font-bold focus:outline-none focus:border-blue-600 focus:border-2 transition-all font-mono"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={t('reservations.form.addItemPlaceholder', 'Item name...')}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <button 
                onClick={() => { handleAddItem(); setIsAddingItem(false); }}
                disabled={!newItemName.trim()}
                className="px-4 h-10 bg-blue-600 text-white rounded-[12px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-20 transition-all"
              >
                {t('common.add', 'Add')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ItemSection;
