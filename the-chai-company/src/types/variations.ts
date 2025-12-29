// src/types/variations.ts - Unified Variation System Types

import { z } from 'zod';

// Base variation option schema
export const VariationOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
  available: z.boolean().default(true),
});

// Category-based selection (for platters)
export const VariationCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['single', 'multiple']), // Single select vs multiple
  required: z.boolean().default(false),
  maxSelections: z.number().min(1).optional(), // For multiple type
  options: z.array(VariationOptionSchema),
});

// Simple variation (for regular menu items)
export const SimpleVariationSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
});

// Complete variation config for any item
export const VariationConfigSchema = z.object({
  // Simple variations (MenuItem style)
  simpleVariations: z.array(SimpleVariationSchema).optional(),
  simpleSelection: z.enum(['single', 'multiple']).optional(), // Default: single

  // Category-based variations (Platter style)
  categories: z.array(VariationCategorySchema).optional(),

  // Global rules
  allowMultipleCategories: z.boolean().default(true), // Can select from multiple categories
  totalMaxSelections: z.number().optional(), // Global max across all
});

// Selection state interfaces
export interface SelectedVariation {
  categoryId?: string; // For category-based
  optionId: string;
  optionName: string;
  price: number;
}

export interface VariationSelections {
  simple: SelectedVariation[]; // For simple variations
  categories: Record<string, SelectedVariation[]>; // categoryId -> selections
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validation schemas for selections
export const SelectionValidationSchema = z.object({
  simple: z.array(z.object({
    categoryId: z.string().optional(),
    optionId: z.string(),
    optionName: z.string(),
    price: z.number()
  })),
  categories: z.record(z.string(), z.array(z.object({
    categoryId: z.string().optional(),
    optionId: z.string(),
    optionName: z.string(),
    price: z.number()
  })))
});

// Complete item variation state
export interface ItemVariationState {
  config: z.infer<typeof VariationConfigSchema>;
  selections: VariationSelections;
  validation: ValidationResult;
  totalPrice: number;
}

// Type exports
export type VariationOption = z.infer<typeof VariationOptionSchema>;
export type VariationCategory = z.infer<typeof VariationCategorySchema>;
export type SimpleVariation = z.infer<typeof SimpleVariationSchema>;
export type VariationConfig = z.infer<typeof VariationConfigSchema>;
