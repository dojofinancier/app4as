# Color Migration Guide: Hardcoded Colors → Semantic Colors

## Problem
Your components use hardcoded Tailwind colors (e.g., `bg-blue-600`, `text-red-500`) that don't use your TweakCN CSS variables. This means the new styles won't apply to these elements.

## Solution
Replace hardcoded colors with semantic color classes that use CSS variables.

## Color Mapping

### Error/Destructive Colors
```tsx
// OLD (hardcoded)
bg-red-50          → bg-error-light
bg-red-100         → bg-error-light
bg-red-200         → bg-error-border
bg-red-500         → bg-error
bg-red-600         → bg-error
bg-red-700         → bg-error
bg-red-800         → bg-error
text-red-600       → text-error
text-red-700       → text-error
text-red-800       → text-error
border-red-200     → border-error-border
border-red-500     → border-error
```

### Success Colors
```tsx
// OLD (hardcoded)
bg-green-50        → bg-success-light
bg-green-100        → bg-success-light
bg-green-500        → bg-success
bg-green-600        → bg-success
bg-green-700        → bg-success
bg-green-800        → bg-success
text-green-500      → text-success
text-green-600      → text-success
text-green-700      → text-success
text-green-800      → text-success
border-green-200    → border-success-border
```

### Warning Colors
```tsx
// OLD (hardcoded)
bg-yellow-50       → bg-warning-light
bg-yellow-100      → bg-warning-light
bg-yellow-200      → bg-warning-border
bg-yellow-400      → bg-warning
bg-yellow-500      → bg-warning
bg-yellow-600      → bg-warning
bg-yellow-800      → bg-warning
text-yellow-400     → text-warning
text-yellow-500     → text-warning
text-yellow-600     → text-warning
text-yellow-800     → text-warning
border-yellow-200   → border-warning-border
```

### Info/Blue Colors
```tsx
// OLD (hardcoded)
bg-blue-50         → bg-info-light
bg-blue-100        → bg-info-light
bg-blue-200        → bg-info-border
bg-blue-500        → bg-info
bg-blue-600        → bg-info
bg-blue-700        → bg-info
bg-blue-800        → bg-info
bg-blue-900        → bg-info
text-blue-500      → text-info
text-blue-600      → text-info
text-blue-700      → text-info
text-blue-800      → text-info
text-blue-900      → text-info
border-blue-200     → border-info-border
```

### Gray/Muted Colors
```tsx
// OLD (hardcoded)
bg-gray-50         → bg-muted
bg-gray-100        → bg-muted
bg-gray-200        → bg-muted
bg-gray-300        → bg-muted
bg-gray-400        → bg-muted
bg-gray-500        → bg-muted-foreground
bg-gray-600        → bg-muted-foreground
bg-gray-700        → bg-muted-foreground
bg-gray-800        → bg-muted-foreground
text-gray-300      → text-muted-foreground
text-gray-400      → text-muted-foreground
text-gray-500      → text-muted-foreground
text-gray-600      → text-muted-foreground
text-gray-700      → text-muted-foreground
text-gray-800      → text-muted-foreground
border-gray-200     → border-border
```

### Orange Colors (for refunds/warnings)
```tsx
// OLD (hardcoded)
bg-orange-50       → bg-warning-light
bg-orange-100      → bg-warning-light
bg-orange-200      → bg-warning-border
bg-orange-500      → bg-warning
bg-orange-600      → bg-warning
bg-orange-700      → bg-warning
bg-orange-800      → bg-warning
text-orange-500     → text-warning
text-orange-600     → text-warning
text-orange-700     → text-warning
text-orange-800     → text-warning
border-orange-200   → border-warning-border
```

### Purple Colors
```tsx
// OLD (hardcoded)
bg-purple-50       → bg-primary/10 (or use accent)
bg-purple-100      → bg-primary/20
bg-purple-500      → bg-primary
bg-purple-600      → bg-primary
text-purple-600     → text-primary
border-purple-200   → border-primary/20
```

## Common Patterns

### Error Messages
```tsx
// OLD
<div className="bg-red-50 border border-red-200 rounded-md p-3">
  <p className="text-red-700 text-sm">{error}</p>
</div>

// NEW
<div className="bg-error-light border border-error-border rounded-md p-3">
  <p className="text-error text-sm">{error}</p>
</div>
```

### Success Messages
```tsx
// OLD
<div className="bg-green-50 border border-green-200 rounded-md">
  <p className="text-green-600">Success!</p>
</div>

// NEW
<div className="bg-success-light border border-success-border rounded-md">
  <p className="text-success">Success!</p>
</div>
```

### Status Badges
```tsx
// OLD
<Badge className="bg-blue-500">Active</Badge>
<Badge className="bg-green-500">Completed</Badge>
<Badge className="bg-yellow-500">Pending</Badge>
<Badge className="bg-red-500">Cancelled</Badge>

// NEW
<Badge className="bg-info">Active</Badge>
<Badge className="bg-success">Completed</Badge>
<Badge className="bg-warning">Pending</Badge>
<Badge className="bg-error">Cancelled</Badge>
```

### Priority Indicators
```tsx
// OLD
<span className={`px-2 py-1 rounded ${
  priority === 0 ? 'bg-red-100 text-red-800' :
  priority >= 80 ? 'bg-green-100 text-green-800' :
  priority >= 50 ? 'bg-yellow-100 text-yellow-800' :
  'bg-gray-100 text-gray-800'
}`}>

// NEW
<span className={`px-2 py-1 rounded ${
  priority === 0 ? 'bg-error-light text-error' :
  priority >= 80 ? 'bg-success-light text-success' :
  priority >= 50 ? 'bg-warning-light text-warning' :
  'bg-muted text-muted-foreground'
}`}>
```

## Migration Script

You can use find/replace in your editor:

### Find/Replace Patterns (VS Code)
1. **Error colors:**
   - Find: `bg-red-50` → Replace: `bg-error-light`
   - Find: `bg-red-100` → Replace: `bg-error-light`
   - Find: `bg-red-500` → Replace: `bg-error`
   - Find: `bg-red-600` → Replace: `bg-error`
   - Find: `bg-red-700` → Replace: `bg-error`
   - Find: `bg-red-800` → Replace: `bg-error`
   - Find: `text-red-600` → Replace: `text-error`
   - Find: `text-red-700` → Replace: `text-error`
   - Find: `text-red-800` → Replace: `text-error`
   - Find: `border-red-200` → Replace: `border-error-border`

2. **Success colors:**
   - Find: `bg-green-50` → Replace: `bg-success-light`
   - Find: `bg-green-100` → Replace: `bg-success-light`
   - Find: `bg-green-500` → Replace: `bg-success`
   - Find: `bg-green-600` → Replace: `bg-success`
   - Find: `bg-green-700` → Replace: `bg-success`
   - Find: `bg-green-800` → Replace: `bg-success`
   - Find: `text-green-500` → Replace: `text-success`
   - Find: `text-green-600` → Replace: `text-success`
   - Find: `text-green-700` → Replace: `text-success`
   - Find: `text-green-800` → Replace: `text-success`

3. **Warning colors:**
   - Find: `bg-yellow-50` → Replace: `bg-warning-light`
   - Find: `bg-yellow-100` → Replace: `bg-warning-light`
   - Find: `bg-yellow-400` → Replace: `bg-warning`
   - Find: `bg-yellow-500` → Replace: `bg-warning`
   - Find: `bg-yellow-600` → Replace: `bg-warning`
   - Find: `bg-yellow-800` → Replace: `bg-warning`
   - Find: `text-yellow-400` → Replace: `text-warning`
   - Find: `text-yellow-500` → Replace: `text-warning`
   - Find: `text-yellow-600` → Replace: `text-warning`
   - Find: `text-yellow-800` → Replace: `text-warning`

4. **Info/Blue colors:**
   - Find: `bg-blue-50` → Replace: `bg-info-light`
   - Find: `bg-blue-100` → Replace: `bg-info-light`
   - Find: `bg-blue-500` → Replace: `bg-info`
   - Find: `bg-blue-600` → Replace: `bg-info`
   - Find: `bg-blue-700` → Replace: `bg-info`
   - Find: `bg-blue-800` → Replace: `bg-info`
   - Find: `text-blue-500` → Replace: `text-info`
   - Find: `text-blue-600` → Replace: `text-info`
   - Find: `text-blue-700` → Replace: `text-info`
   - Find: `text-blue-800` → Replace: `text-info`
   - Find: `text-blue-900` → Replace: `text-info`

5. **Gray colors:**
   - Find: `bg-gray-50` → Replace: `bg-muted`
   - Find: `bg-gray-100` → Replace: `bg-muted`
   - Find: `bg-gray-200` → Replace: `bg-muted`
   - Find: `text-gray-400` → Replace: `text-muted-foreground`
   - Find: `text-gray-500` → Replace: `text-muted-foreground`
   - Find: `text-gray-600` → Replace: `text-muted-foreground`
   - Find: `text-gray-700` → Replace: `text-muted-foreground`
   - Find: `text-gray-800` → Replace: `text-muted-foreground`

## Files to Update

Based on the grep results, these files have the most hardcoded colors:

1. `components/dashboard/admin-dashboard.tsx` - Many blue/green/red colors
2. `components/admin/tutor-management.tsx` - Priority colors
3. `components/admin/appointment-management.tsx` - Status colors
4. `components/admin/order-management.tsx` - Status colors
5. `components/admin/student-appointments-list.tsx` - Badge colors
6. `components/admin/student-orders-list.tsx` - Status colors
7. `components/admin/admin-ticket-details-modal.tsx` - Status badges
8. `components/dashboard/reservation-management-tab.tsx` - Error messages
9. `components/dashboard/create-ticket-modal.tsx` - Error messages
10. `components/dashboard/ratings/student-rating-dialog.tsx` - Star colors

## Testing After Migration

1. Replace `app/globals.css` with `app/globals-tweakcn.css`
2. Run find/replace on components
3. Test all pages to ensure colors display correctly
4. Check dark mode as well

## Need Help?

If you encounter edge cases or specific color mappings, let me know and I'll help create custom mappings!



