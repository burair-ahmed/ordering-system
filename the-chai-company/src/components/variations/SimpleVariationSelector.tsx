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
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              isSelected
                ? 'bg-[#C46A47] text-white shadow-[#C46A47]/20 shadow-lg border-transparent'
                : 'border-2 border-[#E3D6C6] bg-white text-[#6F5A4A] hover:border-[#C46A47] hover:bg-[#C46A47]/5'
            }`}
            aria-pressed={isSelected}
            aria-label={`${selectionType === 'multiple' ? 'Toggle' : 'Select'} ${variation.name} ${variation.price > 0 ? `(+Rs.${variation.price})` : ''}`}
          >
            {variation.name}
            {variation.price > 0 && (
              <span className="ml-1.5 text-xs opacity-90 px-1.5 py-0.5 rounded-md bg-black/5">
                +Rs.{variation.price.toFixed(0)}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
