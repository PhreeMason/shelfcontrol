# ShelfControl Theming Guide

**Last Updated**: November 17, 2024

A comprehensive guide to using the ShelfControl token-based theming system for consistent, maintainable design.

---

## Table of Contents

1. [Overview](#overview)
2. [Typography Tokens](#typography-tokens)
3. [Color Tokens](#color-tokens)
4. [Spacing Tokens](#spacing-tokens)
5. [Shadow Tokens](#shadow-tokens)
6. [Opacity Tokens](#opacity-tokens)
7. [ThemedText Component](#themedtext-component)
8. [ThemedView Component](#themedview-component)
9. [Migration Patterns](#migration-patterns)
10. [Anti-Patterns](#anti-patterns)
11. [Examples](#examples)

---

## Overview

ShelfControl uses a **token-based design system** to ensure consistency and make theming changes easy:

- **Typography Tokens**: 11 predefined font size/weight/lineHeight combinations
- **Color Tokens**: 50+ semantic color names (e.g., `text`, `primary`, `error`)
- **Spacing Tokens**: 7 spacing values (4px - 60px)
- **Shadow Tokens**: 5 elevation levels (subtle to premium)
- **Border Radius Tokens**: 7 radius values (0px - 9999px)

### Philosophy

**Constraint = Speed**: By limiting choices to a predefined set of tokens, you:
- ✅ Move faster (no debates about "should this be 18px or 20px?")
- ✅ Maintain consistency (all titles use the same token)
- ✅ Enable global changes (update a token, update everywhere)
- ✅ Prevent drift (no random one-off font sizes)

---

## Typography Tokens

### Complete Typography Scale

| Token | fontSize | lineHeight | fontWeight | Use Case |
|-------|----------|------------|------------|----------|
| **headlineLarge** | 32px | 36 | 800 | Page headers, hero text |
| **headlineMedium** | 28px | 32 | 600 | Large section headers |
| **headlineSmall** | 24px | 28 | 600 | Medium section headers |
| **titleLarge** | 22px | 26 | 700 | Large titles, prominent labels |
| **titleSubLarge** | 20px | 24 | 600 | Modal titles, dialog headers |
| **titleMediumPlus** | 18px | 22 | 600 | Section headers, card titles |
| **titleMedium** | 16px | 20 | 600 | Small titles, emphasized text |
| **titleSmall** | 14px | 18 | 600 | Tiny titles, labels |
| **bodyLarge** | 16px | 20 | 400 | Default body text |
| **bodyMedium** | 14px | 18 | 400 | Secondary body text |
| **bodySmall** | 12px | 16 | 400 | Captions, small text |
| **labelLarge** | 14px | 18 | 500 | Large labels, buttons |
| **labelMedium** | 12px | 16 | 500 | Medium labels |
| **labelSmall** | 10px | 14 | 500 | Tiny labels, badges |

### Typography Token Usage

```typescript
import { Typography } from '@/constants/Colors';

const styles = StyleSheet.create({
  // ❌ DON'T DO THIS - Custom font size
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },

  // ✅ DO THIS - Use typography token
  title: {
    ...Typography.titleLarge,
  },
});
```

### Why Every Token Includes lineHeight

**Critical for iOS**: Text with `fontSize ≥ 14px` without explicit `lineHeight` will have letters clipped on iOS.

All typography tokens include proper `lineHeight` to prevent this issue.

---

## Color Tokens

### Primary Color Tokens

| Category | Token | Light | Dark | Use Case |
|----------|-------|-------|------|----------|
| **Text** | `text` | #11181C | #FFFFFF | Primary text |
| | `textSecondary` | #687076 | #9CA3AF | Secondary text |
| | `textMuted` | #9CA3AF | #687076 | Muted/disabled text |
| | `textInverse` | #FFFFFF | #11181C | Text on dark background |
| **Background** | `background` | #FFFFFF | #000000 | App background |
| | `surface` | #FFFFFF | #1A1A1A | Card/surface background |
| | `surfaceVariant` | #F1F5F9 | #2A2A2A | Variant surface |
| **Brand** | `primary` | #B8A9D9 | #B8A9D9 | Brand/primary color |
| | `accent` | #E8B4B8 | #E8B4B8 | Accent color |
| **State** | `error` | #E8B4B8 | #EF4444 | Error states |
| | `warning` | #E8B4A0 | #F59E0B | Warning states |
| | `success` | #B8A9D9 | #10B981 | Success states |
| **Urgency** | `pending` | #9CA3AF | #6B7280 | Pending/neutral |
| | `good` | #7a5a8c | #8B5CF6 | On track |
| | `approaching` | #d4a46a | #F59E0B | Tight deadline |
| | `urgent` | #c8696e | #EF4444 | Needs Replanning |

### Color Token Usage

```typescript
import { useTheme } from '@/hooks/useThemeColor';

function MyComponent() {
  const { colors } = useTheme();

  const dynamicStyles = {
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    text: {
      color: colors.textSecondary,
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.text, dynamicStyles.text]}>
        Hello World
      </Text>
    </View>
  );
}
```

---

## Spacing Tokens

### Complete Spacing Scale

ShelfControl uses a **7-value spacing scale** for consistent layouts and spacing:

| Token | Value | Use Case |
|-------|-------|----------|
| **Spacing.xs** | 4px | Minimal spacing, tight gaps between related elements |
| **Spacing.sm** | 8px | Small gaps, compact list items, icon spacing |
| **Spacing.md** | 14px | Default spacing for cards, sections, form fields |
| **Spacing.lg** | 22px | Large spacing, major section breaks, card padding |
| **Spacing.xl** | 30px | Extra large spacing, screen padding, hero sections |
| **Spacing.xxl** | 44px | Very large spacing, major layout breaks |
| **Spacing.xxxl** | 60px | Maximum spacing, special cases |

### Negative Spacing Scale

For **intentional overlap**, **tight semantic grouping**, and **alignment corrections**, use negative spacing tokens:

| Token | Value | Use Case |
|-------|-------|----------|
| **Spacing.negative.xs** | -4px | Inline alignment corrections, tight multi-line spacing |
| **Spacing.negative.sm** | -8px | Error messages attached to fields, header-to-content grouping |
| **Spacing.negative.md** | -14px | Annotation overlays (badges, indicators attached to inputs) |
| **Spacing.negative.lg** | -22px | Full-bleed layouts (breaking out of container padding) |

**⚠️ Use Sparingly**: Negative spacing should only be used for specific semantic purposes. Do not use to "fix" layout issues.

### Spacing Token Usage

```typescript
import { Spacing } from '@/constants/Colors';

const styles = StyleSheet.create({
  // ✅ DO THIS - Use spacing tokens
  card: {
    padding: Spacing.lg,           // 22px card padding
    marginBottom: Spacing.md,      // 14px between cards
    gap: Spacing.sm,               // 8px between card elements
  },

  // ❌ DON'T DO THIS - Hardcoded values
  card: {
    padding: 20,
    marginBottom: 12,
    gap: 8,
  },
});
```

### Common Value Mappings

When migrating existing code, use these mappings:

#### Positive Spacing Mappings

| Hardcoded Value | Closest Token | Token Value | Notes |
|----------------|---------------|-------------|-------|
| 2, 4, 5 | `Spacing.xs` | 4px | Minimal spacing |
| 6, 8, 10 | `Spacing.sm` | 8px | Small gaps |
| 12, 14, 15, 16 | `Spacing.md` | 14px | **Most common!** |
| 18, 20, 22, 24 | `Spacing.lg` | 22px | Large spacing |
| 25, 28, 30, 32 | `Spacing.xl` | 30px | Extra large |
| 40, 44 | `Spacing.xxl` | 44px | Very large |
| 50, 60 | `Spacing.xxxl` | 60px | Maximum |

#### Negative Spacing Mappings

| Hardcoded Value | Closest Token | Token Value | Visual Change | Use Case |
|----------------|---------------|-------------|---------------|----------|
| -2, -4, -5 | `Spacing.negative.xs` | -4px | ±2px | Inline alignment |
| -6, -8, -10 | `Spacing.negative.sm` | -8px | ±2px | Error messages, headers |
| -12, -14, -15, -16 | `Spacing.negative.md` | -14px | ±2px | Badges, annotations |
| -18, -20, -22 | `Spacing.negative.lg` | -22px | ±2px | Full-bleed layouts |

### Semantic Spacing Patterns

#### Card Components
```typescript
const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,          // Internal card padding
    marginBottom: Spacing.md,     // Space between cards
    gap: Spacing.sm,              // Space between card elements
    borderRadius: BorderRadius.md,
  },
});
```

#### Form Layouts
```typescript
const styles = StyleSheet.create({
  formContainer: {
    padding: Spacing.lg,          // Form container padding
    gap: Spacing.md,              // Space between form sections
  },
  formField: {
    marginBottom: Spacing.md,     // Space between fields
  },
  fieldLabel: {
    marginBottom: Spacing.xs,     // Tight label-input spacing
  },
});
```

#### Modals & Sheets
```typescript
const styles = StyleSheet.create({
  modal: {
    padding: Spacing.xl,          // Modal padding
    gap: Spacing.lg,              // Space between modal sections
  },
  modalHeader: {
    marginBottom: Spacing.lg,     // Header separation
  },
  modalActions: {
    marginTop: Spacing.xl,        // Action buttons separation
    gap: Spacing.md,              // Space between buttons
  },
});
```

#### Screen Layouts
```typescript
const styles = StyleSheet.create({
  screenContainer: {
    padding: Spacing.lg,          // Screen edge padding
  },
  section: {
    marginBottom: Spacing.lg,     // Space between sections
    gap: Spacing.md,              // Items within section
  },
});
```

#### Negative Spacing Use Cases

**Use Case 1: Semantic Grouping** (Headers closer to content)
```typescript
const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: Spacing.negative.sm,  // Pull header closer to its content (-8px)
  },
  modalTitle: {
    marginBottom: Spacing.xs,           // Regular spacing
  },
  modalSubtitle: {
    marginTop: Spacing.negative.md,     // Subtitle tight to title (-14px)
  },
});
```

**Use Case 2: Error/Annotation Positioning** (Attached indicators)
```typescript
const styles = StyleSheet.create({
  inputField: {
    marginBottom: Spacing.md,
  },
  errorText: {
    marginTop: Spacing.negative.sm,     // Error attached to input (-8px)
  },
  autoFilledBadge: {
    marginTop: Spacing.negative.md,     // Badge overlaps input (-14px)
  },
});
```

**Use Case 3: Inline Alignment Corrections**
```typescript
const styles = StyleSheet.create({
  hashtagBadge: {
    marginBottom: Spacing.negative.xs,  // Align badge baseline with text (-4px)
  },
  iconInText: {
    marginTop: Spacing.negative.xs,     // Vertically center icon (-4px)
  },
});
```

**Use Case 4: Full-Bleed Layouts** (Breaking out of padding)
```typescript
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,      // Container has padding
  },
  fullWidthCarousel: {
    marginHorizontal: Spacing.negative.lg,  // Break out to edges (-22px)
  },
});
```

**⚠️ When NOT to Use Negative Spacing:**
- ❌ To fix broken layouts (refactor the layout instead)
- ❌ As default spacing (use positive tokens)
- ❌ For general margins (use positive tokens)
- ✅ Only for intentional semantic purposes listed above

### Migration Patterns

#### Pattern 1: Direct Replacement (Exact Matches)

```typescript
// ❌ BEFORE
const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 4,
    paddingBottom: 14,
  },
});

// ✅ AFTER
import { Spacing } from '@/constants/Colors';

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,              // Exact match: 8
    marginTop: Spacing.xs,        // Exact match: 4
    paddingBottom: Spacing.md,    // Exact match: 14
  },
});
```

#### Pattern 2: Near-Token Values (Minor Adjustment)

```typescript
// ❌ BEFORE
const styles = StyleSheet.create({
  card: {
    padding: 16,                  // Close to md (14)
    marginBottom: 20,             // Close to lg (22)
    gap: 12,                      // Close to md (14)
  },
});

// ✅ AFTER
import { Spacing } from '@/constants/Colors';

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,          // 14 (was 16, -2px)
    marginBottom: Spacing.lg,     // 22 (was 20, +2px)
    gap: Spacing.md,              // 14 (was 12, +2px)
  },
});
```

#### Pattern 3: Inconsistent Values → Standardized

```typescript
// ❌ BEFORE - Different padding across similar components
// DeadlineCard.tsx
padding: 16,

// WeeklyStatsCard.tsx
padding: 20,

// GoalsCard.tsx
padding: 18,

// ✅ AFTER - Consistent semantic spacing
// All card components
padding: Spacing.lg,              // 22px consistent
```

### Anti-Patterns

#### ❌ Anti-Pattern 1: Magic Numbers

```typescript
// DON'T
const styles = StyleSheet.create({
  container: {
    paddingVertical: 13,          // Random value
    marginTop: 25,                // Not on scale
    gap: 15,                      // One-off spacing
  },
});

// DO
import { Spacing } from '@/constants/Colors';

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,  // 14px (was 13)
    marginTop: Spacing.lg,        // 22px (was 25)
    gap: Spacing.md,              // 14px (was 15)
  },
});
```

#### ❌ Anti-Pattern 2: Inconsistent Similar Values

```typescript
// DON'T - Mixing 10, 12, 14 for same purpose
gap: 10,                          // Component A
gap: 12,                          // Component B
gap: 14,                          // Component C

// DO - Use consistent token
gap: Spacing.md,                  // All components
```

#### ❌ Anti-Pattern 3: Inline Spacing

```typescript
// DON'T
<View style={{ marginBottom: 8, padding: 12 }}>

// DO
<View style={styles.container}>

// In StyleSheet:
container: {
  marginBottom: Spacing.sm,
  padding: Spacing.md,
}
```

### Edge Cases

#### Special Offsets (e.g., Tab Bar)

For special cases like tab bar offsets, create semantic constants:

```typescript
// constants/Layout.ts
export const Layout = {
  TAB_BAR_OFFSET: 80,            // iOS tab bar + safe area
  FAB_BOTTOM_OFFSET: 45,         // Floating action button
  MODAL_VERTICAL_OFFSET: 100,    // Modal positioning
};

// Usage
import { Layout } from '@/constants/Layout';

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Layout.TAB_BAR_OFFSET,
  },
});
```

#### Platform-Specific Spacing

When platform differences are needed, use conditional tokens:

```typescript
import { Platform } from 'react-native';
import { Spacing } from '@/constants/Colors';

const styles = StyleSheet.create({
  container: {
    padding: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
  },
});
```

---

## Shadow Tokens

### Complete Shadow Scale

ShelfControl uses a **5-level shadow system** for consistent elevation and depth:

| Token | shadowOffset | shadowOpacity | shadowRadius | elevation | Use Case |
|-------|-------------|---------------|--------------|-----------|----------|
| **Shadows.subtle** | {0, 1} | 0.05 | 2 | 1 | Cards, sections, subtle elevation |
| **Shadows.light** | {0, 2} | 0.1 | 4 | 2 | Raised surfaces, default cards |
| **Shadows.medium** | {0, 2} | 0.2 | 6 | 3 | Buttons, important cards, interactive elements |
| **Shadows.elevated** | {0, 4} | 0.25 | 8 | 4 | Dropdowns, modals, FABs |
| **Shadows.premium** | {0, 8} | 0.3 | 16 | 8 | Hero elements, featured content |

All shadows use `shadowColor: '#000'` by default for consistency.

### Themed Shadow Variants

For special branded elements, use themed shadow variants:

| Token | shadowColor | Use Case |
|-------|-------------|----------|
| **Shadows.themed.primary** | #B8A9D9 | Primary branded elements, auth CTAs |
| **Shadows.themed.soft** | rgba(139, 90, 140, 0.12) | Premium cards, hero sections |

### Shadow Token Usage

```typescript
import { Shadows } from '@/constants/Theme';

const styles = StyleSheet.create({
  // ❌ DON'T DO THIS - Hardcoded shadow values
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // ✅ DO THIS - Use shadow token
  card: {
    ...Shadows.light,
  },

  // ✅ Also valid - Use specific shadow level
  fab: {
    ...Shadows.elevated,
  },

  // ✅ Themed variant for branded elements
  authButton: {
    ...Shadows.themed.primary,
  },
});
```

### Shadow Level Guidelines

#### Level 1 - Subtle (Most Common)
**Use for:** Default card elevation, section containers, list items
```typescript
const styles = StyleSheet.create({
  sectionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.subtle,  // Barely visible, gentle separation
  },
});
```

#### Level 2 - Light
**Use for:** Standard cards, raised surfaces, default elevation
```typescript
const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.light,  // Standard card shadow
  },
});
```

#### Level 3 - Medium
**Use for:** Interactive buttons, emphasized cards, slider thumbs
```typescript
const styles = StyleSheet.create({
  button: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.medium,  // Clear affordance for interaction
  },
});
```

#### Level 4 - Elevated
**Use for:** Floating action buttons, dropdowns, modals, overlays
```typescript
const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    ...Shadows.elevated,  // Strong elevation, floats above content
  },
});
```

#### Level 5 - Premium
**Use for:** Hero cards, featured content, special announcements
```typescript
const styles = StyleSheet.create({
  heroCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.premium,  // Maximum depth and presence
  },
});
```

### Platform Considerations

**iOS vs Android:**
- iOS uses `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`
- Android primarily uses `elevation` (numeric value)
- Shadow tokens include both for cross-platform consistency

**Note:** All shadow tokens include both iOS and Android properties, ensuring consistent appearance across platforms.

### Migration Patterns

#### Pattern 1: Direct Replacement

```typescript
// ❌ BEFORE
const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

// ✅ AFTER
import { Shadows } from '@/constants/Theme';

const styles = StyleSheet.create({
  card: {
    ...Shadows.subtle,
  },
});
```

#### Pattern 2: Combining with Other Styles

```typescript
// ✅ Shadows work well with other theme tokens
import { Shadows, Spacing, BorderRadius } from '@/constants/Theme';

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.light,
    // Add other custom styles after shadow
    marginBottom: Spacing.md,
  },
});
```

#### Pattern 3: Conditional Shadows

```typescript
import { Platform } from 'react-native';
import { Shadows } from '@/constants/Theme';

const styles = StyleSheet.create({
  card: {
    ...(Platform.OS === 'ios' ? Shadows.medium : Shadows.light),
  },
});
```

### Common Value Mappings

When migrating existing code, use these mappings:

| Old Shadow Values | Closest Token | Notes |
|------------------|---------------|-------|
| opacity: 0.05, radius: 2, elevation: 1 | `Shadows.subtle` | Exact match |
| opacity: 0.1, radius: 4, elevation: 2-3 | `Shadows.light` | Standard card shadow |
| opacity: 0.2, radius: 6, elevation: 3 | `Shadows.medium` | Interactive elements |
| opacity: 0.25, radius: 8, elevation: 4-5 | `Shadows.elevated` | FABs, modals |
| opacity: 0.3, radius: 16, elevation: 8 | `Shadows.premium` | Hero elements |

### Anti-Patterns

#### ❌ Anti-Pattern 1: Custom Shadow Values

```typescript
// DON'T
const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },  // Non-standard values
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2.5,
  },
});

// DO
const styles = StyleSheet.create({
  card: {
    ...Shadows.light,  // Use standard token
  },
});
```

#### ❌ Anti-Pattern 2: Inline Shadow Styles

```typescript
// DON'T
<View style={{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}}>

// DO
<View style={styles.card}>

const styles = StyleSheet.create({
  card: {
    ...Shadows.light,
  },
});
```

#### ❌ Anti-Pattern 3: Mixing Shadow Properties

```typescript
// DON'T - Partially using token
const styles = StyleSheet.create({
  card: {
    ...Shadows.light,
    shadowOpacity: 0.3,  // Overriding token value
  },
});

// DO - Use the appropriate shadow level
const styles = StyleSheet.create({
  card: {
    ...Shadows.elevated,  // If you need more opacity, use elevated
  },
});
```

### Using StyleMixins

For convenience, `StyleMixins.shadow` defaults to `Shadows.light`:

```typescript
import { StyleMixins } from '@/constants/Theme';

const styles = StyleSheet.create({
  card: {
    ...StyleMixins.shadow,  // Same as Shadows.light
  },
});
```

**Note:** Prefer using `Shadows` directly for clarity about which shadow level you're using.

---

## Opacity Tokens

ShelfControl has **two opacity systems** for different use cases:

### 1. Hex OPACITY (for Color Transparency)

Located in `@/utils/formatters`, these are hex string suffixes for adding transparency to colors:

| Token | Hex Value | Opacity % | Use Case |
|-------|-----------|-----------|----------|
| **OPACITY.SUBTLE** | '20' | 12.5% | Subtle backgrounds, light tints |
| **OPACITY.CALENDAR** | '40' | 25% | Calendar cell backgrounds |
| **OPACITY.MEDIUM** | '80' | 50% | Disabled state backgrounds |
| **OPACITY.HIGH** | 'C0' | 75% | Hover states, stronger tints |

#### Hex OPACITY Usage

```typescript
import { OPACITY } from '@/utils/formatters';

// Append to any hex color for transparency
const styles = StyleSheet.create({
  calendarCell: {
    backgroundColor: urgencyColor + OPACITY.CALENDAR,  // e.g., '#B8A9D940'
  },
  subtleBackground: {
    backgroundColor: colors.primary + OPACITY.SUBTLE,  // e.g., '#B8A9D920'
  },
});
```

### 2. Numeric Opacity (for StyleSheet opacity)

Located in `@/constants/Colors`, these are numeric values for the `opacity` style property:

| Token | Value | Use Case |
|-------|-------|----------|
| **Opacity.full** | 1 | Full visibility (default) |
| **Opacity.high** | 0.85 | Slightly reduced (pressed states) |
| **Opacity.muted** | 0.7 | Muted text, secondary info |
| **Opacity.secondary** | 0.6 | Secondary hints, helper text |
| **Opacity.disabled** | 0.5 | Disabled states |
| **Opacity.faint** | 0.4 | Very faint elements |
| **Opacity.hairline** | 0.15 | Subtle dividers, barely visible |

#### Numeric Opacity Usage

```typescript
import { Opacity } from '@/constants/Colors';

const styles = StyleSheet.create({
  // ❌ DON'T DO THIS - Hardcoded opacity
  hint: {
    opacity: 0.6,
  },

  // ✅ DO THIS - Use opacity token
  hint: {
    opacity: Opacity.secondary,
  },

  disabledButton: {
    opacity: Opacity.disabled,
  },

  mutedText: {
    opacity: Opacity.muted,
  },
});
```

### When to Use Which

| Need | Use | Import |
|------|-----|--------|
| Transparent background color | Hex `OPACITY` | `@/utils/formatters` |
| Element/text visibility | Numeric `Opacity` | `@/constants/Colors` |

```typescript
// Transparent background = Hex OPACITY
backgroundColor: colors.primary + OPACITY.SUBTLE

// Element visibility = Numeric Opacity
opacity: Opacity.muted
```

### Common Value Mappings

When migrating existing code:

| Old Value | Token | Notes |
|-----------|-------|-------|
| 0.85, 0.8 | `Opacity.high` | Pressed states |
| 0.7 | `Opacity.muted` | Most common for secondary text |
| 0.6 | `Opacity.secondary` | Helper text, hints |
| 0.5 | `Opacity.disabled` | Disabled states |
| 0.4, 0.3 | `Opacity.faint` | Very subtle elements |
| 0.15, 0.1 | `Opacity.hairline` | Dividers, hairlines |

---

## ThemedText Component

### API Reference

```typescript
type ThemedTextProps = {
  /** Direct typography token (e.g., 'titleLarge', 'bodySmall') */
  typography?: TypographyToken;

  /** Semantic variant combining typography + color */
  variant?: TextVariant;

  /** Color token (e.g., 'textInverse', 'primary') */
  color?: ColorToken;

  /** Custom style (for spacing, alignment, etc.) */
  style?: TextStyle;

  /** All other Text props */
  ...TextProps;
};
```

### Priority Rules

1. **Typography**: `typography` prop > `variant`'s typography
2. **Color**: `color` prop > `variant`'s color
3. **Style**: `style` prop applies last (for spacing, layout, alignment, etc.)

**IMPORTANT:** When using `typography` or `color` props, do NOT duplicate these in the StyleSheet. The props handle the styling automatically. Use `style` only for non-typography, non-color styles like spacing, alignment, and layout.

### Usage Patterns

#### Pattern 1: Typography + Color Tokens (Preferred)

**Use when you need explicit control over size and color:**

```typescript
// Large white title
<ThemedText typography="titleLarge" color="textInverse">
  Mason Williams
</ThemedText>

// 18px section header with primary color
<ThemedText typography="titleMediumPlus" color="primary">
  Books Finished This Year
</ThemedText>

// 20px modal title (default text color)
<ThemedText typography="titleSubLarge">
  Filter Notes
</ThemedText>

// 24px headline
<ThemedText typography="headlineSmall" color="text">
  Welcome Back
</ThemedText>
```

#### Pattern 2: Semantic Variants (Simpler)

**Use for common semantic patterns:**

```typescript
// Default body text (16px, text color)
<ThemedText variant="default">
  This is the main content text.
</ThemedText>

// Secondary text (14px, textSecondary color)
<ThemedText variant="secondary">
  This is less important text.
</ThemedText>

// Title (16px semibold, text color)
<ThemedText variant="title">
  Section Title
</ThemedText>

// Muted caption (14px, textMuted color)
<ThemedText variant="muted">
  Last updated 2 days ago
</ThemedText>
```

#### Pattern 3: Combining Patterns

**You can override variant with typography or color:**

```typescript
// Use secondary variant but with larger typography
<ThemedText variant="secondary" typography="titleLarge">
  Larger Secondary Text
</ThemedText>

// Use title variant but with inverse color
<ThemedText variant="title" color="textInverse">
  White Title
</ThemedText>
```

#### Pattern 4: Custom Spacing/Layout

**Use style prop ONLY for non-typography styles:**

```typescript
// ✅ CORRECT: Typography via prop, spacing/layout via style
<ThemedText
  typography="titleMediumPlus"
  color="primary"
  style={{ marginBottom: 16, textAlign: 'center' }}
>
  Centered Header
</ThemedText>

// ❌ WRONG: Don't put typography in StyleSheet when using typography prop
const styles = StyleSheet.create({
  header: {
    ...Typography.titleMediumPlus,  // Redundant!
    marginBottom: 16,
    textAlign: 'center',
  },
});
<ThemedText typography="titleMediumPlus" style={styles.header}>
  Centered Header
</ThemedText>
```

**Remember:** The `typography` and `color` props handle styling. The `style` prop is for:
- Spacing (margin, padding)
- Layout (flexbox, positioning)
- Alignment (textAlign)
- Transforms
- Other non-typography, non-color styles

---

## ThemedView Component

### API Reference

```typescript
type ThemedViewProps = {
  /** Surface variant ('default', 'variant', 'container', 'elevated') */
  variant?: SurfaceVariant;

  /** Custom style */
  style?: ViewStyle;

  /** All other View props */
  ...ViewProps;
};
```

### Usage

```typescript
// Default surface (white background)
<ThemedView variant="default">
  <ThemedText>Content</ThemedText>
</ThemedView>

// Surface variant (light gray background)
<ThemedView variant="variant">
  <ThemedText>Content</ThemedText>
</ThemedView>

// Elevated surface (with shadow)
<ThemedView variant="elevated">
  <ThemedText>Content</ThemedText>
</ThemedView>
```

---

## Migration Patterns

### Migrating from Custom Styles to Typography Tokens

#### Before (Anti-pattern):
```typescript
const styles = StyleSheet.create({
  profileName: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});

<Text style={styles.profileName}>{name}</Text>
<Text style={styles.sectionTitle}>Books Read</Text>
```

#### After (Correct):
```typescript
const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 12, // Only non-typography styles
  },
});

<ThemedText typography="titleLarge" color="textInverse">
  {name}
</ThemedText>
<ThemedText typography="titleMediumPlus" style={styles.sectionTitle}>
  Books Read
</ThemedText>
```

### Migrating from Variant + Override to Typography Prop

#### Before (Anti-pattern):
```typescript
<ThemedText variant="title" style={styles.modalTitle}>
  Filter Options
</ThemedText>

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 20,      // Overrides variant's 16px
    fontWeight: '600',
    lineHeight: 24,
  },
});
```

#### After (Correct):
```typescript
<ThemedText typography="titleSubLarge">
  Filter Options
</ThemedText>

// No style needed! Typography token includes everything
```

### Migrating Non-Standard Sizes

| Old Size | Nearest Token | Alternative |
|----------|---------------|-------------|
| 13px | `bodySmall` (12px) or `bodyMedium` (14px) | Choose based on visual hierarchy |
| 15px | `bodyMedium` (14px) or `bodyLarge` (16px) | Prefer standard size |
| 17px | `bodyLarge` (16px) or `titleMediumPlus` (18px) | Prefer standard size |
| 18px | `titleMediumPlus` ✅ | Now supported! |
| 19px | `titleMediumPlus` (18px) or `titleSubLarge` (20px) | Choose based on context |
| 20px | `titleSubLarge` ✅ | Now supported! |
| 21px | `titleSubLarge` (20px) or `titleLarge` (22px) | Choose based on context |

---

## Anti-Patterns

### ❌ Anti-Pattern 1: Variant + fontSize Override

**DON'T:**
```typescript
<ThemedText variant="title" style={{ fontSize: 22 }}>
  Title
</ThemedText>
```

**DO:**
```typescript
<ThemedText typography="titleLarge">
  Title
</ThemedText>
```

### ❌ Anti-Pattern 2: Redundant Typography in StyleSheet with ThemedText

**DON'T:**
```typescript
// Redundant! Typography is applied twice
<ThemedText typography="bodySmall" style={styles.label}>
  Label
</ThemedText>

const styles = StyleSheet.create({
  label: {
    ...Typography.bodySmall,  // ❌ Already applied by typography prop!
    textAlign: 'center',
  },
});
```

**DO:**
```typescript
// ThemedText's typography prop handles the font styling
<ThemedText typography="bodySmall" style={styles.label}>
  Label
</ThemedText>

const styles = StyleSheet.create({
  label: {
    textAlign: 'center',  // ✅ Only non-typography styles
  },
});
```

**Why this matters:**
- ThemedText's `typography` prop automatically applies the typography token
- StyleSheet should only contain non-typography styles (spacing, alignment, transforms, etc.)
- The `style` prop is applied **after** typography/variant, so it's for overrides and layout only

### ❌ Anti-Pattern 3: Custom Font Sizes

**DON'T:**
```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
});
```

**DO:**
```typescript
const styles = StyleSheet.create({
  title: {
    ...Typography.titleSubLarge,
  },
});

// OR better yet, use ThemedText:
<ThemedText typography="titleSubLarge">
```

### ❌ Anti-Pattern 4: Missing lineHeight

**DON'T:**
```typescript
const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    fontWeight: '600',
    // Missing lineHeight! Will clip on iOS
  },
});
```

**DO:**
```typescript
// Typography tokens ALWAYS include lineHeight
<ThemedText typography="titleMediumPlus">
```

### ❌ Anti-Pattern 5: Hardcoded Colors

**DON'T:**
```typescript
const styles = StyleSheet.create({
  text: {
    color: '#FFFFFF',
  },
});
```

**DO:**
```typescript
<ThemedText color="textInverse">
// OR
const { colors } = useTheme();
const dynamicStyles = {
  text: { color: colors.textInverse },
};
```

---

## Examples

### Example 1: Profile Header

```typescript
function ProfileHeader({ name, bio }: Props) {
  const { colors } = useTheme();

  return (
    <ThemedView variant="elevated" style={styles.container}>
      {/* Large white name */}
      <ThemedText typography="titleLarge" color="textInverse">
        {name}
      </ThemedText>

      {/* Secondary bio text */}
      <ThemedText
        typography="bodyMedium"
        color="textSecondary"
        style={styles.bio}
      >
        {bio}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  bio: {
    marginTop: 8,
  },
});
```

### Example 2: Modal Title

```typescript
function FilterModal({ onClose }: Props) {
  return (
    <ThemedView variant="default" style={styles.modal}>
      {/* 20px modal title */}
      <ThemedText typography="titleSubLarge" style={styles.title}>
        Filter Options
      </ThemedText>

      {/* Body content */}
      <ThemedText variant="default">
        Select your filter preferences below.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  modal: {
    padding: 24,
    borderRadius: 16,
  },
  title: {
    marginBottom: 16,
  },
});
```

### Example 3: Card with Multiple Text Styles

```typescript
function BookCard({ title, author, pages }: Props) {
  return (
    <ThemedView variant="variant" style={styles.card}>
      {/* 18px card title */}
      <ThemedText typography="titleMediumPlus" style={styles.title}>
        {title}
      </ThemedText>

      {/* 14px secondary author */}
      <ThemedText variant="secondary" style={styles.author}>
        by {author}
      </ThemedText>

      {/* 12px muted page count */}
      <ThemedText
        typography="bodySmall"
        color="textMuted"
        style={styles.pages}
      >
        {pages} pages
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  title: {
    marginBottom: 4,
  },
  author: {
    marginBottom: 8,
  },
  pages: {
    fontStyle: 'italic',
  },
});
```

### Example 4: Status Badge

```typescript
function StatusBadge({ status }: { status: 'pending' | 'good' | 'urgent' }) {
  const { colors } = useTheme();

  const colorMap = {
    pending: colors.pending,
    good: colors.good,
    urgent: colors.urgent,
  };

  return (
    <View style={[styles.badge, { backgroundColor: colorMap[status] }]}>
      <ThemedText
        typography="labelSmall"
        color="textInverse"
        style={styles.badgeText}
      >
        {status.toUpperCase()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    textTransform: 'uppercase',
  },
});
```

---

## Quick Reference

### When to Use What

| Scenario | Approach |
|----------|----------|
| Need specific font size | Use `typography` prop with token |
| Need specific color | Use `color` prop with token |
| Common semantic pattern | Use `variant` prop |
| Custom spacing/alignment | Use `style` prop (no typography styles) |
| Want to use themed colors | Use `useTheme()` hook |
| Creating custom component | Spread Typography token in styles |

### Decision Tree

```
Do you need text?
├─ Yes → Use ThemedText
│  ├─ Need specific size?
│  │  ├─ Yes → typography="tokenName"
│  │  └─ No → variant="variantName"
│  ├─ Need specific color?
│  │  ├─ Yes → color="colorToken"
│  │  └─ No → (use variant's color)
│  └─ Need spacing/alignment?
│     └─ Yes → style={{ marginBottom: 16 }}
│
└─ No → Use ThemedView
   └─ variant="default|variant|elevated"
```

---

## Resources

- **Typography Scale**: [src/constants/Colors.ts](src/constants/Colors.ts)
- **Color Tokens**: [src/constants/Colors.ts](src/constants/Colors.ts)
- **Theme Utils**: [src/constants/Theme.ts](src/constants/Theme.ts)
- **ThemedText**: [src/components/themed/ThemedText.tsx](src/components/themed/ThemedText.tsx)
- **useTheme Hook**: [src/hooks/useThemeColor.ts](src/hooks/useThemeColor.ts)
- **Migration Progress**: [THEMING_MIGRATION_PROGRESS.md](THEMING_MIGRATION_PROGRESS.md)

---

**Questions or Issues?**

If you encounter theming challenges not covered here, check [THEMING_MIGRATION_PROGRESS.md](THEMING_MIGRATION_PROGRESS.md) for migration patterns and lessons learned.
