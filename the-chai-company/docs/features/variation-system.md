# 🎛️ Variation System Documentation

The Variation System is a unified framework for handling customizable menu items and platters across the entire ordering system. It provides a consistent, type-safe way to manage complex customization options for both customers and admins.

## 📋 Overview

### Problem Solved
Previously, menu items and platters used inconsistent data structures:
- **Menu Items**: Simple `{name: string, price: string}` arrays
- **Platters**: Complex nested `categories` and `additionalChoices` objects

This led to:
- ❌ Duplicate code across components
- ❌ Type safety issues
- ❌ Inconsistent validation
- ❌ Difficult maintenance

### Solution
A unified `VariationConfig` system that handles all customization scenarios with:
- ✅ Type-safe TypeScript interfaces
- ✅ Zod runtime validation
- ✅ Consistent UI components
- ✅ Admin and customer compatibility

## 🏗️ Architecture

### Core Components

#### 1. Type Definitions (`src/types/variations.ts`)
```typescript
interface VariationConfig {
  // Simple variations (menu items)
  simpleVariations?: SimpleVariation[];
  simpleSelection?: 'single' | 'multiple';

  // Complex variations (platters)
  categories?: VariationCategory[];
  allowMultipleCategories?: boolean;

  // Global settings
  totalMaxSelections?: number;
}

interface SimpleVariation {
  id: string;
  name: string;
  price: number;
}

interface VariationCategory {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  maxSelections?: number;
  options: VariationOption[];
}
```

#### 2. Custom Hook (`src/hooks/useVariationSelector.ts`)
```typescript
const {
  selections,        // Current user selections
  totalPrice,        // Calculated total with variations
  validation,        // Real-time validation results
  selectSimpleVariation,    // For menu items
  selectCategoryVariation,  // For platters
  isValid,           // Overall validation state
  getFlattenedVariations    // For cart/order submission
} = useVariationSelector(config, basePrice);
```

#### 3. UI Components (`src/components/variations/`)
- `VariationSelector`: Main orchestrator component
- `SimpleVariationSelector`: Radio/checkbox buttons for menu items
- `CategoryVariationSelector`: Dropdowns/buttons for complex categories

## 🎯 Usage Examples

### Menu Item Variations (Simple)

```typescript
// Configuration
const variationConfig: VariationConfig = {
  simpleVariations: [
    { id: 'size-small', name: 'Small', price: 0 },
    { id: 'size-medium', name: 'Medium', price: 50 },
    { id: 'size-large', name: 'Large', price: 100 }
  ],
  simpleSelection: 'single'
};

// Usage in component
const { totalPrice, selectSimpleVariation } = useVariationSelector(variationConfig, 200);

// Result: Customer pays ₹200 (base) + ₹50 (medium) = ₹250
```

### Platter Variations (Complex)

```typescript
// Configuration
const variationConfig: VariationConfig = {
  categories: [
    {
      id: 'protein',
      name: 'Choose Protein',
      type: 'single',
      required: true,
      options: [
        { id: 'chicken', name: 'Chicken', price: 0 },
        { id: 'beef', name: 'Beef', price: 100 }
      ]
    },
    {
      id: 'sides',
      name: 'Extra Sides',
      type: 'multiple',
      required: false,
      maxSelections: 2,
      options: [
        { id: 'fries', name: 'French Fries', price: 50 },
        { id: 'salad', name: 'Garden Salad', price: 75 }
      ]
    }
  ]
};
```

## 🔄 Admin ↔ Customer Flow

### Scenario: Menu Item Creation & Ordering

#### Admin Side (MenuItemForm.tsx)
```typescript
// Admin creates menu item with variations
const menuItem = {
  title: "Custom Pizza",
  price: 300,
  variations: [
    { name: "Small (+₹0)", price: "0" },
    { name: "Medium (+₹50)", price: "50" },
    { name: "Large (+₹100)", price: "100" }
  ]
};

// System converts to VariationConfig internally
const variationConfig = {
  simpleVariations: [
    { id: "size-0", name: "Small", price: 0 },
    { id: "size-1", name: "Medium", price: 50 },
    { id: "size-2", name: "Large", price: 100 }
  ]
};
```

#### Customer Side (MenuItem.tsx)
```typescript
// Customer sees the same variations in unified UI
<VariationSelector
  config={variationConfig}
  selections={selections}
  onSimpleSelect={selectSimpleVariation}
/>

// When ordering, system flattens for cart
const cartItem = {
  id: "pizza-123",
  title: "Custom Pizza",
  price: 300,
  variations: ["Small"] // Flattened for display
};
```

### Scenario: Platter Customization

#### Admin Side (AddPlatterForm.tsx)
```typescript
// Admin configures platter with categories
const platterConfig = {
  title: "Sharing Platter",
  basePrice: 500,
  categories: [
    {
      categoryName: "Main Protein",
      options: ["Chicken", "Beef", "Fish"]
    }
  ],
  additionalChoices: [
    {
      heading: "Extra Sides",
      options: [
        { name: "Fries", uuid: "side-1" },
        { name: "Salad", uuid: "side-2" }
      ]
    }
  ]
};
```

#### Customer Side (PlatterItem.tsx)
```typescript
// Customer sees unified variation interface
<VariationSelector
  config={variationConfig}
  selections={selections}
  onCategorySelect={selectCategoryVariation}
/>

// Order submission includes all customizations
const orderItem = {
  platterId: "platter-123",
  customizations: {
    protein: "Chicken",
    sides: ["Fries", "Salad"]
  }
};
```

## 🔧 Implementation Details

### Data Conversion Logic

#### From Legacy to VariationConfig
```typescript
// Menu Item Conversion
const convertMenuVariations = (variations: {name: string, price: string}[]) => ({
  simpleVariations: variations.map((v, i) => ({
    id: `variation-${i}`,
    name: v.name.replace(/\s*\(\+₹\d+\)/, ''), // Remove price from name
    price: parseFloat(v.price) || 0
  })),
  simpleSelection: 'single' as const
});

// Platter Conversion
const convertPlatterVariations = (categories: any[], additionalChoices: any[]) => ({
  categories: [
    // Required categories
    ...categories.map((cat, i) => ({
      id: `category-${i}`,
      name: cat.categoryName,
      type: 'single' as const,
      required: true,
      options: cat.options.map((opt: any, j: number) => ({
        id: opt.name,
        name: opt.name,
        price: 0,
        available: true
      }))
    })),
    // Additional choices as optional categories
    ...additionalChoices.map((choice, i) => ({
      id: `additional-${i}`,
      name: choice.heading,
      type: 'single' as const,
      required: false,
      options: choice.options.map((opt: any) => ({
        id: opt.uuid,
        name: opt.name,
        price: 0,
        available: true
      }))
    }))
  ]
});
```

#### From VariationConfig to API Format
```typescript
// For cart/order submission
const flattenVariations = (selections: VariationSelections): string[] => {
  const simple = selections.simple.map(s => `${s.optionName}`);
  const categories = Object.entries(selections.categories)
    .flatMap(([catId, vars]) => vars.map(v => `${catId}: ${v.optionName}`));

  return [...simple, ...categories];
};
```

### Validation Rules

#### Real-time Validation
```typescript
const validationRules = {
  requiredCategories: (config: VariationConfig, selections: VariationSelections) => {
    return config.categories?.filter(cat => cat.required)
      .every(cat => selections.categories[cat.id]?.length > 0) ?? true;
  },

  selectionLimits: (config: VariationConfig, selections: VariationSelections) => {
    return config.categories?.every(cat => {
      const selected = selections.categories[cat.id]?.length || 0;
      return !cat.maxSelections || selected <= cat.maxSelections;
    }) ?? true;
  },

  totalLimits: (config: VariationConfig, selections: VariationSelections) => {
    const total = selections.simple.length +
      Object.values(selections.categories).flat().length;
    return !config.totalMaxSelections || total <= config.totalMaxSelections;
  }
};
```

## 🎨 UI Components

### VariationSelector (Main Component)
```jsx
<VariationSelector
  config={variationConfig}
  selections={selections}
  onSimpleSelect={selectSimpleVariation}
  onCategorySelect={selectCategoryVariation}
  errors={validation.errors}
  warnings={validation.warnings}
  className="space-y-4"
/>
```

### SimpleVariationSelector
- **Single Selection**: Radio buttons with gradient styling
- **Multiple Selection**: Checkboxes with toggle states
- **Price Display**: Shows additional cost inline
- **Accessibility**: Proper ARIA labels and keyboard navigation

### CategoryVariationSelector
- **Single Selection**: Dropdown with search/filter
- **Multiple Selection**: Button grid with selection limits
- **Loading States**: Shows spinner during dynamic option loading
- **Validation**: Real-time error display

## 🔄 API Integration

### Menu Items API
```typescript
// GET /api/menuitems - Returns items with VariationConfig
{
  id: "item-123",
  title: "Custom Pizza",
  price: 300,
  variations: ["Small", "Medium (+₹50)", "Large (+₹100)"], // Legacy format
  variationConfig: { /* New format */ }
}

// POST /api/menuitems - Accepts both formats
{
  title: "Custom Pizza",
  price: 300,
  variations: ["Small", "Medium (+₹50)", "Large (+₹100)"] // Converted internally
}
```

### Platter API
```typescript
// POST /api/platter - Accepts complex configuration
{
  title: "Sharing Platter",
  basePrice: 500,
  categories: [
    {
      categoryName: "Protein",
      options: ["Chicken", "Beef"]
    }
  ],
  additionalChoices: [
    {
      heading: "Sides",
      options: [
        { name: "Fries", uuid: "side-1" },
        { name: "Salad", uuid: "side-2" }
      ]
    }
  ]
}
```

## 🧪 Testing

### Unit Tests
```typescript
describe('useVariationSelector', () => {
  it('calculates total price correctly', () => {
    const config = { simpleVariations: [{ id: '1', name: 'Large', price: 50 }] };
    const { totalPrice } = useVariationSelector(config, 200);
    expect(totalPrice).toBe(250);
  });

  it('validates required selections', () => {
    const config = {
      categories: [{ id: '1', name: 'Required', required: true, options: [] }]
    };
    const { isValid } = useVariationSelector(config, 100);
    expect(isValid).toBe(false);
  });
});
```

### Integration Tests
- Form submission with variations
- Cart calculation with customizations
- Order creation with complex selections
- Admin editing of variation configurations

## 🔮 Future Enhancements

### Planned Features
- **Variation Templates**: Pre-configured variation sets
- **Dynamic Pricing**: Rules-based price calculations
- **Visual Customization**: Image-based selection options
- **Bulk Operations**: Admin can modify multiple variations
- **Analytics**: Track popular variation combinations

### Extensibility
- **Custom Validators**: Plugin system for complex rules
- **Third-party Integrations**: POS system compatibility
- **Multi-language Support**: Localized variation names
- **Accessibility**: Enhanced screen reader support

## 📚 Related Documentation

- [Menu System](./menu-system.md)
- [Admin Panel](./admin-panel.md)
- [API Endpoints](../api/endpoints.md)
- [Component Library](../components/ui-components.md)

## 🚀 Migration Guide

### For Existing Menu Items
1. Variations automatically converted on load
2. No breaking changes for customers
3. Admin forms updated to use new system
4. Backward compatibility maintained

### For New Features
1. Always use VariationConfig for new customizable items
2. Implement validation rules early
3. Test both admin and customer experiences
4. Document variation scenarios

---

**Last Updated:** December 2025
**Version:** 1.0.0
