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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          {category.name}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {category.maxSelections && (
          <span className="text-xs text-gray-500">
            (max {category.maxSelections})
          </span>
        )}
        {loading && (
          <div className="ml-auto w-4 h-4 border-2 border-gray-300 border-t-[#741052] rounded-full animate-spin" />
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-gray-500">Loading options...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {category.type === 'single' ? (
            // Dropdown for single selection
            <select
              className={`w-full p-3 border rounded-xl bg-white/70 transition-colors ${
                hasSelection ? 'border-[#741052]' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-[#741052]/30`}
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
              <option value="">
                {isRequired ? `Select ${category.name} *` : `Choose ${category.name}`}
              </option>
              {options.map(option => {
                const optionId = option.id || (option as LegacyOption).uuid || option.name;
                return (
                  <option key={optionId} value={optionId}>
                    {(option as LegacyOption).title || option.name}
                    {option.price > 0 && ` (+Rs.${option.price})`}
                  </option>
                );
              })}
            </select>
          ) : (
            // Buttons for multiple selection
            <div className="flex flex-wrap gap-2">
              {options.map(option => {
                const optionId = option.id || (option as LegacyOption).uuid || option.name;
                const isSelected = selectedIds.includes(optionId);

                return (
                  <motion.button
                    key={optionId}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(option)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                      isSelected
                        ? 'border-transparent bg-gradient-to-r from-[#741052] to-[#d0269b] text-white shadow-md'
                        : 'border border-gray-300 bg-white/60 hover:border-[#741052] hover:bg-[#741052]/5'
                    }`}
                    aria-pressed={isSelected}
                    aria-label={`Toggle ${(option as LegacyOption).title || option.name}`}
                  >
                    {(option as LegacyOption).title || option.name}
                    {option.price > 0 && (
                      <span className="ml-1 text-xs opacity-90">
                        (+Rs.{option.price})
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Selection count for multiple */}
          {category.type === 'multiple' && selectedOptions.length > 0 && (
            <p className="text-xs text-gray-500">
              {selectedOptions.length} selected
              {category.maxSelections && ` (max ${category.maxSelections})`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
