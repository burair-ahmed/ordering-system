// src/components/variations/VariationSelector.tsx - Main Variation Selector Component

'use client';

import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariationConfig, SelectedVariation } from '../../types/variations';
import { SimpleVariationSelector } from './SimpleVariationSelector';
import { CategoryVariationSelector } from './CategoryVariationSelector';

interface VariationSelectorProps {
  config: VariationConfig;
  selections: {
    simple: SelectedVariation[];
    categories: Record<string, SelectedVariation[]>;
  };
  onSimpleSelect: (variationId: string, option: SelectedVariation) => void;
  onCategorySelect: (categoryId: string, option: SelectedVariation) => void;
  errors?: string[];
  warnings?: string[];
  className?: string;
}

export const VariationSelector: FC<VariationSelectorProps> = ({
  config,
  selections,
  onSimpleSelect,
  onCategorySelect,
  errors = [],
  warnings = [],
  className = ''
}) => {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <div
      className={`space-y-6 ${className}`}
      role="region"
      aria-label="Item customization options"
      aria-describedby={hasErrors ? "variation-errors" : hasWarnings ? "variation-warnings" : undefined}
    >
      {/* Simple Variations */}
      {config.simpleVariations && config.simpleVariations.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-[#6B3F2A] mb-3 uppercase tracking-wider">Options</h4>
          <SimpleVariationSelector
            variations={config.simpleVariations}
            selectedIds={selections.simple.map(s => s.optionId)}
            onSelect={onSimpleSelect}
            selectionType={config.simpleSelection || 'single'}
          />
        </div>
      )}

      {/* Category Variations */}
      {config.categories && config.categories.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-[#6B3F2A] mb-3 uppercase tracking-wider">Customizations</h4>
          <div className="space-y-6">
            {config.categories.map(category => (
              <CategoryVariationSelector
                key={category.id}
                category={category}
                selectedOptions={selections.categories[category.id] || []}
                onSelect={(option) => onCategorySelect(category.id, option)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Validation Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            id="variation-errors"
            role="alert"
            aria-live="polite"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 p-3 rounded-xl bg-[#8B2E2E]/5 border border-[#8B2E2E]/10"
          >
            {errors.map((error, idx) => (
              <p key={idx} className="text-sm text-[#8B2E2E] flex items-center gap-2 font-medium">
                <span className="text-[#8B2E2E]" aria-hidden="true">⚠️</span>
                {error}
              </p>
            ))}
          </motion.div>
        )}

        {warnings.length > 0 && (
          <motion.div
            id="variation-warnings"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 p-3 rounded-xl bg-amber-50 border border-amber-200"
          >
            {warnings.map((warning, idx) => (
              <p key={idx} className="text-sm text-amber-700 flex items-center gap-2 font-medium">
                <span className="text-amber-600" aria-hidden="true">ℹ️</span>
                {warning}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
