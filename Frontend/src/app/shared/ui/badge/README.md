# Badge Component

A reusable badge component for displaying status indicators, labels, and tags throughout the application.

## Types

```typescript
import { Badge, BadgeVariant, BadgeSize } from '../../shared/ui/badge/badge.types';

// Available types
type BadgeVariant = 'featured' | 'info' | 'success' | 'warning' | 'danger' | 'default';
type BadgeSize = 'sm' | 'md';

interface Badge {
  label: string;
  variant: BadgeVariant;
  size?: BadgeSize;
}
```

## Usage

### Basic Usage

```typescript
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { Badge } from '../../shared/ui/badge/badge.types';

@Component({
  imports: [BadgeComponent],
  // ...
})
```

```html
<app-badge label="Featured" variant="featured" />
<app-badge label="New" variant="info" />
<app-badge label="Success" variant="success" />
<app-badge label="Warning" variant="warning" />
<app-badge label="Error" variant="danger" />
<app-badge label="Default" variant="default" />
```

### With Size

```html
<app-badge label="Small Badge" variant="info" size="sm" />
<app-badge label="Medium Badge" variant="info" size="md" />
```

### Dynamic Usage

```typescript
import { Badge } from '../../shared/ui/badge/badge.types';

export class MyComponent {
  badges = computed(() => {
    const result: Badge[] = [];

    if (this.item().featured) {
      result.push({ label: '⭐ Featured', variant: 'featured' });
    }

    if (this.item().isNew) {
      result.push({ label: 'New', variant: 'info' });
    }

    return result;
  });
}
```

```html
@for (badge of badges(); track badge.label) {
<app-badge [label]="badge.label" [variant]="badge.variant" />
}
```

## Props

| Prop      | Type                                                                      | Default     | Description                      |
| --------- | ------------------------------------------------------------------------- | ----------- | -------------------------------- |
| `label`   | `string`                                                                  | required    | The text to display in the badge |
| `variant` | `'featured' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'default'` | `'default'` | The visual style variant         |
| `size`    | `'sm' \| 'md'`                                                            | `'md'`      | The size of the badge            |

## Variants

- **featured**: Gold background, used for highlighted/featured items (⭐ Featured products/categories)
- **info**: Blue/accent color, used for informational badges (Root level, Level indicators)
- **success**: Green, used for positive status indicators
- **warning**: Gray, used for neutral warnings or secondary information
- **danger**: Red, used for errors or critical information
- **default**: Default gray styling

## Examples in the Codebase

### Admin Item Card

The badge is used within the `AdminItemCardComponent` to display category and product badges:

```typescript
badges = computed(() => {
  const badges = [];
  if (this.item().featured) {
    badges.push({ label: '⭐ Featured', variant: 'featured' });
  }
  return badges;
});
```

### Product Admin Panel

```html
<app-admin-item-card
  [badges]="product.featured ? [{ label: '⭐ Featured', variant: 'featured' }] : []"
  ...
/>
```

### Category Admin Panel

```typescript
import { Badge } from '../../../../shared/ui/badge/badge.types';

badges = computed(() => {
  const badges: Badge[] = [];
  if (this.node().category.featured) {
    badges.push({ label: '⭐ Featured', variant: 'featured' });
  }
  if (this.node().level > 0) {
    badges.push({ label: `Level ${this.node().level}`, variant: 'warning' });
  } else {
    badges.push({ label: 'Root', variant: 'info' });
  }
  return badges;
});
```

## Styling

The badge component uses CSS custom properties (design tokens) for consistent theming:

### Design Tokens Used

- **Font sizes**: `--font-size-xs`
- **Spacing**: `--space-1`, `--space-2`, `--space-3`
- **Border radius**: `--radius-sm`
- **Font weight**: `--font-weight-medium`, `--font-weight-semibold`
- **Border width**: `--border-width-thin`

### Color Tokens by Variant

- **Featured**: `--color-surface-warning`, `--color-text-warning`, `--color-border-warning`
- **Info**: `--color-accent-interactive`, `--color-button-text`
- **Success**: `--color-surface-success`, `--color-text-success`, `--color-border-success`
- **Warning**: `--color-surface-muted`, `--color-text-secondary`, `--border-subtle`
- **Danger**: `--color-surface-critical`, `--color-text-critical`, `--border-critical`
- **Default**: `--color-surface-muted`, `--color-text-primary`, `--border-subtle`

The component automatically adapts to light and dark themes through the design token system. All colors, spacing, and typography scale consistently with the rest of the application.
