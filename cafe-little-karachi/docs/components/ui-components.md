# 🎨 Component Library

Comprehensive overview of reusable UI components, design patterns, and implementation guidelines for the ordering system.

## 📋 Component Categories

- [Layout Components](#layout-components)
- [Form Components](#form-components)
- [Feedback Components](#feedback-components)
- [Navigation Components](#navigation-components)
- [Data Display](#data-display)
- [Variation Components](#variation-components)

## 🏗️ Layout Components

### Container
Responsive container with consistent max-widths.

```jsx
import { Container } from '@/components/ui/container';

<Container>
  <h1>Page Content</h1>
</Container>
```

**Props:**
- `size`: `'sm' | 'md' | 'lg' | 'xl'` (default: 'lg')
- `className`: Additional CSS classes

### Card
Glassmorphism card with backdrop blur and shadow.

```jsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Grid System
Responsive grid layouts.

```jsx
import { Grid, GridItem } from '@/components/ui/grid';

<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="4">
  <GridItem>Item 1</GridItem>
  <GridItem>Item 2</GridItem>
  <GridItem>Item 3</GridItem>
</Grid>
```

## 📝 Form Components

### Button Variants

#### Primary Button
```jsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md">
  Order Now
</Button>
```

**Styling:**
```css
background: linear-gradient(135deg, #741052 0%, #d0269b 100%);
color: white;
border-radius: 0.5rem;
padding: 0.75rem 1.5rem;
font-weight: 600;
box-shadow: 0 4px 14px 0 rgba(116, 16, 82, 0.25);
```

#### Secondary Button
```jsx
<Button variant="secondary" size="md">
  Cancel
</Button>
```

**Styling:**
```css
background: white;
color: #741052;
border: 2px solid #741052;
border-radius: 0.5rem;
```

#### Outline Button
```jsx
<Button variant="outline" size="sm">
  Edit
</Button>
```

#### Ghost Button
```jsx
<Button variant="ghost" size="sm">
  View Details
</Button>
```

### Input Components

#### Text Input
```jsx
import { Input } from '@/components/ui/input';

<Input
  type="text"
  placeholder="Enter your name"
  value={value}
  onChange={handleChange}
  error={hasError}
  helperText="This field is required"
/>
```

**Features:**
- Focus states with primary color
- Error states with red border
- Helper text support
- Icon support

#### Textarea
```jsx
import { Textarea } from '@/components/ui/textarea';

<Textarea
  placeholder="Enter description"
  rows={4}
  value={value}
  onChange={handleChange}
/>
```

#### Select
```jsx
import { Select } from '@/components/ui/select';

<Select value={value} onChange={handleChange}>
  <option value="">Select option</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</Select>
```

### Form Validation

#### Error Display
```jsx
import { FormError } from '@/components/ui/form-error';

{errors.name && <FormError message={errors.name} />}
```

#### Success Display
```jsx
import { FormSuccess } from '@/components/ui/form-success';

{success && <FormSuccess message="Form submitted successfully!" />}
```

## 💬 Feedback Components

### Toast Notifications
```jsx
import { toast } from 'sonner';

// Success
toast.success("Order placed successfully!");

// Error
toast.error("Failed to place order");

// Info
toast.info("Please wait...");

// Warning
toast.warning("Item is out of stock");
```

### Loading States

#### Spinner
```jsx
import { Spinner } from '@/components/ui/spinner';

<Spinner size="md" color="primary" />
```

**Sizes:** `xs`, `sm`, `md`, `lg`
**Colors:** `primary`, `secondary`, `white`

#### Skeleton
```jsx
import { Skeleton } from '@/components/ui/skeleton';

<Skeleton variant="card" />
<Skeleton variant="text" lines={3} />
```

### Modal System
```jsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';

<Modal isOpen={isOpen} onClose={handleClose}>
  <ModalHeader>
    <h2>Confirm Order</h2>
  </ModalHeader>
  <ModalBody>
    <p>Are you sure you want to place this order?</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={handleClose}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

## 🧭 Navigation Components

### Header
```jsx
import { Header } from '@/components/layout/header';

<Header />
```

**Features:**
- Logo and branding
- Navigation menu
- Cart indicator
- User menu

### Breadcrumbs
```jsx
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Menu', href: '/menu' },
    { label: 'Pizza', href: '/menu/pizza' }
  ]}
/>
```

### Tabs
```jsx
import { Tabs, Tab } from '@/components/ui/tabs';

<Tabs value={activeTab} onChange={setActiveTab}>
  <Tab value="menu">Menu</Tab>
  <Tab value="orders">Orders</Tab>
  <Tab value="profile">Profile</Tab>
</Tabs>
```

## 📊 Data Display

### Table
```jsx
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableCell>Item</TableCell>
      <TableCell>Price</TableCell>
      <TableCell>Quantity</TableCell>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>₹{item.price}</TableCell>
        <TableCell>{item.quantity}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Badge
```jsx
import { Badge } from '@/components/ui/badge';

<Badge variant="success">In Stock</Badge>
<Badge variant="warning">Low Stock</Badge>
<Badge variant="error">Out of Stock</Badge>
```

### Avatar
```jsx
import { Avatar } from '@/components/ui/avatar';

<Avatar src={imageUrl} alt="User" size="md" />
```

## 🎛️ Variation Components

### VariationSelector (Main)
```jsx
import { VariationSelector } from '@/components/variations/VariationSelector';

<VariationSelector
  config={variationConfig}
  selections={selections}
  onSimpleSelect={handleSimpleSelect}
  onCategorySelect={handleCategorySelect}
  errors={validationErrors}
  warnings={validationWarnings}
/>
```

### SimpleVariationSelector
For menu item variations (radio/checkbox style).

```jsx
import { SimpleVariationSelector } from '@/components/variations/SimpleVariationSelector';

<SimpleVariationSelector
  variations={simpleVariations}
  selectedIds={selectedIds}
  onSelect={handleSelect}
  selectionType="single"
/>
```

### CategoryVariationSelector
For complex platter categories (dropdown/select style).

```jsx
import { CategoryVariationSelector } from '@/components/variations/CategoryVariationSelector';

<CategoryVariationSelector
  category={category}
  selectedOptions={selectedOptions}
  onSelect={handleSelect}
  fetchOptions={fetchCategoryOptions}
/>
```

## 🎨 Design Tokens

### Colors
```css
/* Primary Theme */
--color-primary-500: #741052;
--color-primary-600: #5c0d40;
--color-secondary-500: #d0269b;

/* Semantic Colors */
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #3b82f6;

/* Neutral Colors */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-900: #111827;
```

### Typography
```css
/* Headings */
--font-size-h1: 2.25rem; /* 36px */
--font-size-h2: 1.875rem; /* 30px */
--font-size-h3: 1.5rem;   /* 24px */
--font-size-h4: 1.25rem;  /* 20px */

/* Body */
--font-size-base: 1rem;   /* 16px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-xs: 0.75rem;  /* 12px */

/* Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Spacing
```css
/* Spacing Scale */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
```

### Border Radius
```css
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem;   /* 8px */
--radius-xl: 0.75rem;  /* 12px */
--radius-full: 9999px; /* Fully rounded */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## ♿ Accessibility Guidelines

### ARIA Labels
```jsx
<Button aria-label="Add item to cart">
  <ShoppingCartIcon />
</Button>
```

### Focus Management
```jsx
// Custom focus styles
.focus\:ring-2:focus {
  box-shadow: 0 0 0 2px rgba(116, 16, 82, 0.2);
}
```

### Keyboard Navigation
- **Tab Order:** Logical tab sequence
- **Enter/Space:** Activate buttons and links
- **Arrow Keys:** Navigate dropdowns and selects
- **Escape:** Close modals and dropdowns

### Screen Reader Support
```jsx
<div role="status" aria-live="polite">
  Item added to cart
</div>
```

## 🔧 Implementation Patterns

### Custom Hooks
```typescript
// useLocalStorage hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### Component Composition
```jsx
// Compound component pattern
function MenuItem({ children, ...props }) {
  return (
    <Card {...props}>
      {children}
    </Card>
  );
}

MenuItem.Image = function MenuItemImage({ src, alt }) {
  return <img src={src} alt={alt} className="menu-item-image" />;
};

MenuItem.Content = function MenuItemContent({ children }) {
  return <div className="menu-item-content">{children}</div>;
};

// Usage
<MenuItem>
  <MenuItem.Image src="pizza.jpg" alt="Margherita Pizza" />
  <MenuItem.Content>
    <h3>Margherita Pizza</h3>
    <p>₹250</p>
  </MenuItem.Content>
</MenuItem>
```

## 📚 Related Documentation

- [Cursor Rules](../../.cursorrules)
- [Variation System](../features/variation-system.md)
- [API Endpoints](../api/endpoints.md)
- [Project README](../../README.md)

---

## 🚀 Component Development Guidelines

### 1. Always Use TypeScript
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  // Implementation
}
```

### 2. Implement Accessibility
```jsx
<button
  aria-label={ariaLabel}
  aria-pressed={isPressed}
  disabled={disabled}
  className={cn(buttonVariants({ variant, size }), className)}
  {...props}
>
  {children}
</button>
```

### 3. Use Design System
```jsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-[#741052] to-[#d0269b] text-white hover:opacity-90",
        secondary: "bg-white border-2 border-[#741052] text-[#741052] hover:bg-[#741052] hover:text-white",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
      },
    },
  }
);
```

### 4. Handle Edge Cases
```jsx
export function PriceDisplay({ price, currency = '₹' }: PriceDisplayProps) {
  if (typeof price !== 'number' || isNaN(price)) {
    return <span className="text-gray-400">Price unavailable</span>;
  }

  return (
    <span className="font-semibold text-[#741052]">
      {currency}{price.toFixed(2)}
    </span>
  );
}
```

---

**Last Updated:** December 2025
**Component Library Version:** v1.0.0
