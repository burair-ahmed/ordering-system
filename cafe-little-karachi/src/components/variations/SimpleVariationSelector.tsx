// src/components/variations/SimpleVariationSelector.tsx

'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';
import { SimpleVariation, SelectedVariation } from '../../types/variations';

interface SimpleVariationSelectorProps {
  variations: SimpleVariation[];
  selectedIds: string[];
  onSelect: (variationId: string, option: SelectedVariation) => void;
  selectionType: 'single' | 'multiple';
}

export const SimpleVariationSelector: FC<SimpleVariationSelectorProps> = ({
  variations,
  selectedIds,
  onSelect,
  selectionType
}) => {
  const handleSelect = (variation: SimpleVariation) => {
    const option: SelectedVariation = {
      optionId: variation.id,
      optionName: variation.name,
      price: variation.price
    };
    onSelect(variation.id, option);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {variations.map(variation => {
        const isSelected = selectedIds.includes(variation.id);
        return (
          <motion.button
            key={variation.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(variation)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
              isSelected
                ? 'border-transparent bg-gradient-to-r from-[#741052] to-[#d0269b] text-white shadow-md'
                : 'border border-gray-300 bg-white/60 hover:border-[#741052] hover:bg-[#741052]/5'
            }`}
            aria-pressed={isSelected}
            aria-label={`${selectionType === 'multiple' ? 'Toggle' : 'Select'} ${variation.name} ${variation.price > 0 ? `(+Rs.${variation.price})` : ''}`}
          >
            {variation.name}
            {variation.price > 0 && (
              <span className="ml-1 text-xs opacity-90">
                (+Rs.{variation.price})
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
