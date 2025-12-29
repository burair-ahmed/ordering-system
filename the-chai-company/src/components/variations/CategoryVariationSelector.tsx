// src/components/variations/CategoryVariationSelector.tsx

'use client';

import { FC, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VariationCategory, SelectedVariation, VariationOption } from '../../types/variations';

// Legacy option format for backward compatibility
interface LegacyOption {
  id?: string;
  uuid?: string;
  name: string;
  title?: string;
  price?: number;
}
import { Loader2 } from 'lucide-react';

interface CategoryVariationSelectorProps {
  category: VariationCategory;
  selectedOptions: SelectedVariation[];
  onSelect: (option: SelectedVariation) => void;
  // For dynamic loading (e.g., menu items by category)
  fetchOptions?: (categoryName: string) => Promise<VariationOption[]>;
}

export const CategoryVariationSelector: FC<CategoryVariationSelectorProps> = ({
  category,
  selectedOptions,
  onSelect,
  fetchOptions
}) => {
  const [dynamicOptions, setDynamicOptions] = useState<VariationOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Load dynamic options if fetch function provided
  useEffect(() => {
    if (fetchOptions && category.options.length === 0) {
      setLoading(true);
      fetchOptions(category.name)
        .then(options => {
          setDynamicOptions(options);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [fetchOptions, category.name, category.options.length]);

  const options = category.options.length > 0 ? category.options : dynamicOptions;
  const selectedIds = selectedOptions.map(opt => opt.optionId);

  const handleSelect = (option: VariationOption | LegacyOption) => {
    const selectedVariation: SelectedVariation = {
      optionId: option.id || (option as LegacyOption).uuid || option.name,
      optionName: (option as LegacyOption).title || option.name,
      price: option.price || 0
    };
    onSelect(selectedVariation);
  };

  const isRequired = category.required;
  const hasSelection = selectedOptions.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-bold text-[#6B3F2A]">
          {category.name}
          {isRequired && <span className="text-[#8B2E2E] ml-1">*</span>}
        </label>
        {category.maxSelections && (
          <span className="text-xs font-medium text-[#6F5A4A]/60">
            (up to {category.maxSelections})
          </span>
        )}
        {loading && (
          <div className="ml-auto w-4 h-4 border-2 border-[#E3D6C6] border-t-[#C46A47] rounded-full animate-spin" />
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-4 text-[#C46A47]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-bold">Crafting options...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {category.type === 'single' ? (
            // Dropdown for single selection
            <div className="relative group">
              <select
                className={`w-full p-4 pr-10 border-2 rounded-2xl bg-white font-bold text-[#2E1C14] transition-all appearance-none cursor-pointer ${
                  hasSelection ? 'border-[#C46A47] ring-4 ring-[#C46A47]/5' : 'border-[#E3D6C6] hover:border-[#C46A47]/50'
                } focus:outline-none focus:border-[#C46A47] focus:ring-4 focus:ring-[#C46A47]/10`}
                value={selectedOptions[0]?.optionId || ''}
                onChange={(e) => {
                  const selectedOption = options.find(opt =>
                    (opt.id || (opt as LegacyOption).uuid || opt.name) === e.target.value
                  );
                  if (selectedOption) handleSelect(selectedOption);
                }}
                aria-label={`Select ${category.name}`}
                aria-required={isRequired}
              >
                <option value="" className="text-[#6F5A4A]">
                  {isRequired ? `Select ${category.name} *` : `Choose ${category.name}`}
                </option>
                {options.map(option => {
                  const optionId = option.id || (option as LegacyOption).uuid || option.name;
                  return (
                    <option key={optionId} value={optionId}>
                      {(option as LegacyOption).title || option.name}
                      {option.price > 0 ? ` (+Rs.${option.price.toFixed(0)})` : ''}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#C46A47]">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ) : (
            // Buttons for multiple selection
            <div className="flex flex-wrap gap-2.5">
              {options.map(option => {
                const optionId = option.id || (option as LegacyOption).uuid || option.name;
                const isSelected = selectedIds.includes(optionId);

                return (
                  <motion.button
                    key={optionId}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(option)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#C46A47] text-white border-transparent shadow-[#C46A47]/20 shadow-lg'
                        : 'border-[#E3D6C6] bg-white text-[#6F5A4A] hover:border-[#C46A47] hover:bg-[#C46A47]/5'
                    }`}
                    aria-pressed={isSelected}
                    aria-label={`Toggle ${(option as LegacyOption).title || option.name}`}
                  >
                    {(option as LegacyOption).title || option.name}
                    {option.price > 0 && (
                      <span className="ml-1.5 text-xs opacity-90 px-1.5 py-0.5 rounded-md bg-black/5">
                        +Rs.{option.price.toFixed(0)}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Selection count for multiple */}
          {category.type === 'multiple' && selectedOptions.length > 0 && (
            <p className="text-xs font-bold text-[#C46A47] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C46A47]" />
              {selectedOptions.length} selected
              {category.maxSelections && ` (max ${category.maxSelections})`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
