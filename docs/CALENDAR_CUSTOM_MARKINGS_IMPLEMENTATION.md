# Calendar Custom Markings Implementation

**Created:** December 1, 2024
**Last Updated:** December 1, 2024
**Status:** ✅ Implemented

## Recent Updates (Dec 1, 2024)

### "Hide Dates on Covers" Toggle
Added user preference to hide date numbers and tint overlays on cover images for a cleaner look.

| File | Changes |
|------|---------|
| `src/providers/PreferencesProvider.tsx` | Added `hideDatesOnCovers` boolean preference with AsyncStorage persistence |
| `src/components/features/calendar/CalendarFilterSheet.tsx` | Added "Display Options" section with toggle switch |
| `src/components/features/calendar/CustomDayComponent.tsx` | Conditionally hides date text and tint overlay based on preference |

**Behavior:**
- Toggle OFF (default): Shows date number + tint overlay + urgency border on covers
- Toggle ON: Shows only cover image + urgency border (cleaner look)

### Filter Sheet Improvements
- **Removed color boxes from activity filters** - Activity events now show just labels (no colored icons)
- **Due date filters match urgency colors** - Border and text colors now match their urgency color (green/purple/orange/red) when active

## Overview

Enhanced calendar view with custom day components featuring:
1. Book cover images as cell backgrounds for deadlines with covers
2. Urgency-colored tinted backgrounds for deadlines without covers
3. 6:9 aspect ratio cells (36x54px) matching book cover proportions
4. Urgency priority system showing most urgent deadline when multiple exist on same date

## User Problem

> "The small dots are kinda hard to see on the calendar and the colours are tricky to differentiate between. Could we maybe highlight the whole number with a square and a brighter colour? Especially for urgent ones"

## Implementation Summary

### What Changed

| File | Changes |
|------|---------|
| `src/utils/formatters.ts` | Added `OPACITY.CALENDAR: '40'` (25% opacity for deadline backgrounds) |
| `src/types/calendar.types.ts` | Added `customStyles` property with `coverImageUrl` support |
| `src/types/deadline.types.ts` | Added `cover_image_url` to books relation type |
| `src/services/deadlines.service.ts` | Updated queries to fetch `cover_image_url` from books relation |
| `src/utils/calendarUtils.ts` | Rewrote `calculateMarkedDates()` with cover image support and book fallback |
| `src/app/(authenticated)/calendar.tsx` | Changed `markingType="custom"`, updated selection to use border overlay |
| `src/components/features/calendar/CustomDayComponent.tsx` | Custom day renderer with cover images, urgency borders, 6:9 cells |
| `src/components/features/calendar/CalendarLegend.tsx` | Changed dots to 24x24 colored boxes with sample "12" text |

---

## Behavior

### Deadline Dates with Cover Images
- Book cover image as cell background (36x54px cells, 6:9 aspect ratio)
- Urgency color as border (2px)
- Black text with shadow for readability on varied cover backgrounds
- When multiple deadlines on same date, shows most urgent deadline's cover
- Cover fallback: `deadline.cover_image_url` → `deadline.books.cover_image_url`

### Deadline Dates without Cover Images
- Tinted background using `urgencyColor + OPACITY.CALENDAR` (25%)
- Text color matches urgency color with fontWeight 600

### Activity-Only Dates
- Subtle grey background using `ACTIVITY_DOT_COLOR + OPACITY.SUBTLE` (12.5%)
- No text color change (keeps deadlines more prominent)

### Selected Date
- Primary border overlay (2px) preserves any urgency/activity background
- Dates without activities show border only

### Urgency Priority Order
```typescript
['overdue', 'urgent', 'impossible', 'approaching', 'good']
```

---

## Cover Image Implementation

### Data Flow
1. `deadlinesService` fetches deadlines with `books(publisher, cover_image_url)`
2. `calculateMarkedDates()` collects cover URLs with fallback logic
3. Most urgent deadline's cover is passed via `customStyles.coverImageUrl`
4. `CustomDayComponent` renders the cover as cell background

### Cover Fallback Logic
```typescript
// Same as useDeadlineCardViewModel.ts
const coverUrl = deadline.cover_image_url || deadline.books?.cover_image_url;
urgencyData.push({
  coverImageUrl: getCoverImageUrl(coverUrl),
  // ...
});
```

### Cell Dimensions
- Width: 36px
- Height: 54px
- Aspect ratio: 6:9 (matches book cover proportions)
- Border radius: 4px

---

## Color Application

Uses existing theme colors with opacity - **no new color tokens needed**:

| Type | Background | Text | Border (with cover) |
|------|------------|------|---------------------|
| Completed | `colors.successGreen + OPACITY.CALENDAR` | `colors.successGreen` | `colors.successGreen` |
| On Track | `colors.good + OPACITY.CALENDAR` | `colors.good` | `colors.good` |
| Tight | `colors.approaching + OPACITY.CALENDAR` | `colors.approaching` | `colors.approaching` |
| Urgent/Overdue | `colors.urgent + OPACITY.CALENDAR` | `colors.urgent` | `colors.urgent` |
| Activity Only | `ACTIVITY_DOT_COLOR + OPACITY.SUBTLE` | (default) | N/A |
| With Cover | Cover image | Black (#000000) | Urgency color (2px) |

---

## Legend

Updated CalendarLegend shows:
- 24x24 colored boxes with "12" sample text for deadline types
- Subtle grey box (no text) for activity events
- Info text: "When multiple due dates fall on one day, the most urgent is shown. Book covers appear on dates with deadlines."

---

## Testing Checklist

### Calendar Display
- [x] Single deadline on date shows correct urgency color (tinted bg + colored text)
- [x] Multiple deadlines on same date shows most urgent color
- [x] Deadline with cover image shows cover as background with urgency border
- [x] Deadline without cover image falls back to solid urgency color
- [x] Book cover_image_url fallback works when deadline has no custom cover
- [x] Activity-only dates show subtle grey background
- [x] Selected date shows primary border overlay on colored background
- [x] Selected date without marking shows primary border only
- [x] Legend boxes match calendar cell styling
- [x] TypeScript compiles without errors
- [x] 6:9 aspect ratio cells display correctly
- [x] Black text with shadow is readable on cover images

### Hide Dates on Covers Toggle
- [x] Toggle appears in filter sheet under "Display Options"
- [x] Toggle ON hides date numbers on cover cells
- [x] Toggle ON hides tint overlay on cover cells
- [x] Toggle OFF shows date numbers and tint (default behavior)
- [x] Non-cover cells unaffected by toggle
- [x] Preference persists across app restarts

### Filter Sheet
- [x] Due date filters show colored boxes
- [x] Activity filters show labels only (no color boxes)
- [x] Active due date filters have matching urgency border/text colors
- [x] Active activity filters have primary purple border/text colors

---

## Rollback

If issues occur, revert to multi-dot by:
1. Change `markingType="multi-dot"` in calendar.tsx
2. Restore original `calculateMarkedDates()` logic that returns dots array
3. Restore original LegendItem with dot styling
4. Remove `cover_image_url` from deadlines service queries (optional)
