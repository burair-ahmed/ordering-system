// src/hooks/useVariationSelector.ts - Custom Hook for Variation Management

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  VariationConfig,
  VariationSelections,
  SelectedVariation,
  ValidationResult,
  SelectionValidationSchema
} from '../types/variations';

export function useVariationSelector(config: VariationConfig, basePrice: number = 0) {
  const [selections, setSelections] = useState<VariationSelections>({
    simple: [],
    categories: {}
  });

  // Calculate total variation price
  const variationPrice = useMemo(() => {
    const simplePrice = selections.simple.reduce((sum, v) => sum + v.price, 0);
    const categoryPrice = Object.values(selections.categories)
      .flat()
      .reduce((sum, v) => sum + v.price, 0);
    return simplePrice + categoryPrice;
  }, [selections]);

  // Validate selections with Zod and custom rules
  const validation = useMemo((): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // First, validate structure with Zod
    const zodResult = SelectionValidationSchema.safeParse(selections);
    if (!zodResult.success) {
      errors.push('Invalid selection format');
      return { isValid: false, errors, warnings };
    }

    // Check required categories
    if (config.categories) {
      config.categories.forEach(category => {
        const selected = selections.categories[category.id] || [];
        if (category.required && selected.length === 0) {
          errors.push(`Please select ${category.name}`);
        }
      });
    }

    // Check selection limits
    if (config.categories) {
      config.categories.forEach(category => {
        const selected = selections.categories[category.id] || [];
        if (category.maxSelections && selected.length > category.maxSelections) {
          errors.push(`Maximum ${category.maxSelections} selections allowed for ${category.name}`);
        }
      });
    }

    // Check global limits
    const totalSelections = selections.simple.length +
      Object.values(selections.categories).flat().length;

    if (config.totalMaxSelections && totalSelections > config.totalMaxSelections) {
      errors.push(`Maximum ${config.totalMaxSelections} total selections allowed`);
    }

    // Warnings for incomplete selections
    if (config.categories && !config.allowMultipleCategories) {
      const categoryCount = Object.keys(selections.categories).length;
      if (categoryCount > 1) {
        warnings.push('Only one category selection is recommended');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }, [config, selections]);

  // Select simple variation
  const selectSimpleVariation = useCallback((variationId: string, option: SelectedVariation) => {
    setSelections(prev => {
      const isSelected = prev.simple.some(v => v.optionId === variationId);
      const selectionType = config.simpleSelection || 'single';

      if (selectionType === 'single') {
        // Replace existing
        return {
          ...prev,
          simple: isSelected ? [] : [option]
        };
      } else {
        // Toggle for multiple
        return {
          ...prev,
          simple: isSelected
            ? prev.simple.filter(v => v.optionId !== variationId)
            : [...prev.simple, option]
        };
      }
    });
  }, [config.simpleSelection]);

  // Select category variation
  const selectCategoryVariation = useCallback((categoryId: string, option: SelectedVariation) => {
    setSelections(prev => {
      const category = config.categories?.find(c => c.id === categoryId);
      if (!category) return prev;

      const currentSelections = prev.categories[categoryId] || [];
      const isSelected = currentSelections.some(v => v.optionId === option.optionId);

      let newSelections: SelectedVariation[];

      if (category.type === 'single') {
        // Replace for single select
        newSelections = isSelected ? [] : [option];
      } else {
        // Toggle for multiple select
        newSelections = isSelected
          ? currentSelections.filter(v => v.optionId !== option.optionId)
          : [...currentSelections, option];
      }

      return {
        ...prev,
        categories: {
          ...prev.categories,
          [categoryId]: newSelections
        }
      };
    });
  }, [config.categories]);

  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelections({ simple: [], categories: {} });
  }, []);

  // Get flattened variations for cart/order
  const getFlattenedVariations = useCallback((): string[] => {
    const simpleVars = selections.simple.map(v => v.optionName);
    const categoryVars = Object.values(selections.categories)
      .flat()
      .map(v => v.optionName);
    return [...simpleVars, ...categoryVars];
  }, [selections]);

  // Reset when config changes
  useEffect(() => {
    clearSelections();
  }, [config, clearSelections]);

  return {
    selections,
    variationPrice,
    totalPrice: basePrice + variationPrice,
    validation,
    selectSimpleVariation,
    selectCategoryVariation,
    clearSelections,
    getFlattenedVariations,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings
  };
}
