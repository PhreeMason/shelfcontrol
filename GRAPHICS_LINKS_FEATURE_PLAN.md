# Plan: Deadline Graphics Links Section

## Overview

Add a new "Graphics" section to the deadline detail view where users can store links to external graphics and promotional images (e.g., Google Drive, Dropbox, publisher media kits). Users can open, copy, edit, and delete these links.

## Requirements

- Users can add multiple links per deadline (name + URL pairs)
- Links are stored permanently in the database
- Users can: open link in browser, copy URL to clipboard, edit, delete
- For social sharing and publisher/review purposes

---

## Implementation Steps

### 1. Database Migration

**New file**: `supabase/migrations/YYYYMMDDHHMMSS_create_deadline_graphics.sql`

```sql
CREATE TABLE deadline_graphics (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deadline_id text NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_deadline_graphics_user_deadline ON deadline_graphics(user_id, deadline_id);

ALTER TABLE deadline_graphics ENABLE ROW LEVEL SECURITY;

-- RLS policies for CRUD operations
CREATE POLICY "Users can view own deadline graphics" ON deadline_graphics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deadline graphics" ON deadline_graphics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deadline graphics" ON deadline_graphics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deadline graphics" ON deadline_graphics FOR DELETE USING (auth.uid() = user_id);
```

After migration: run `npm run genTypes`

### 2. Constants Updates

**File**: `src/constants/database.ts`
- Add `DEADLINE_GRAPHICS: 'deadline_graphics'` to `DB_TABLES`

**File**: `src/constants/queryKeys.ts`
- Add `GRAPHICS: { BY_DEADLINE: (userId: string, deadlineId: string) => ['graphics', userId, deadlineId] as const }`

### 3. Types

**New file**: `src/types/graphics.types.ts`

```typescript
import { Tables, TablesInsert, TablesUpdate } from './database.types';

export type DeadlineGraphic = Tables<'deadline_graphics'>;
export type DeadlineGraphicInsert = TablesInsert<'deadline_graphics'>;
export type DeadlineGraphicUpdate = TablesUpdate<'deadline_graphics'>;
```

### 4. Service Layer

**New file**: `src/services/graphics.service.ts`

Follow `contacts.service.ts` pattern with:
- `getGraphics(userId, deadlineId)` - fetch all graphics for a deadline
- `addGraphic(userId, deadlineId, { name, url })` - create new graphic link
- `updateGraphic(graphicId, userId, { name?, url? })` - update existing
- `deleteGraphic(graphicId, userId)` - delete graphic

Use `generateId('dg')` for IDs (dg = deadline graphic).

### 5. React Query Hooks

**New file**: `src/hooks/useGraphics.ts`

Follow `useContacts.ts` pattern:
- `useGetGraphics(deadlineId)` - query hook
- `useAddGraphic()` - mutation with cache invalidation
- `useUpdateGraphic()` - mutation with cache invalidation
- `useDeleteGraphic()` - mutation with cache invalidation

### 6. Form Validation

**New file**: `src/schemas/graphicFormSchema.ts`

```typescript
import { z } from 'zod';

export const graphicFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  url: z.string().url('Please enter a valid URL'),
});

export type GraphicFormData = z.infer<typeof graphicFormSchema>;
```

### 7. UI Components

#### 7.1 GraphicForm Component
**New file**: `src/components/features/deadlines/GraphicForm.tsx`

Simple form with:
- Name input (CustomInput)
- URL input (CustomInput with keyboardType="url")
- Cancel/Save buttons
- react-hook-form + zod validation

#### 7.2 GraphicCard Component
**New file**: `src/components/features/deadlines/GraphicCard.tsx`

Display single link with:
- Name (primary text)
- URL preview (secondary, truncated)
- Actions: Open (`Linking.openURL`), Copy (`expo-clipboard`), Edit, Delete
- Icons: `arrow.up.right.square`, `doc.on.clipboard`, `pencil`, `trash`

#### 7.3 DeadlineGraphicsSection Component
**New file**: `src/components/features/deadlines/DeadlineGraphicsSection.tsx`

Follow `DeadlineContactsSection.tsx` pattern exactly:
- ThemedView container with section styling
- Header: title "Graphics", subtitle "Links to promo images and media"
- Add button with `plus.circle.fill` icon
- State: `isAdding`, `editingGraphicId`
- List of GraphicCard components
- Empty state with ghost UI and `photo.on.rectangle` icon
- Help text footer

### 8. Integration

**File**: `src/app/deadline/[id]/index.tsx`

Add import and render `DeadlineGraphicsSection` after `DeadlineTagsSection`:

```tsx
import { DeadlineGraphicsSection } from '@/components/features/deadlines/DeadlineGraphicsSection';

// In render, after DeadlineTagsSection (around line 150):
<DeadlineGraphicsSection deadline={deadline} />
```

### 9. Analytics Events

Track in section component:
- `deadline_graphic_added`
- `deadline_graphic_edited`
- `deadline_graphic_deleted`
- `deadline_graphic_opened`
- `deadline_graphic_copied`

---

## Critical Reference Files

| Purpose | File |
|---------|------|
| Section UI pattern | `src/components/features/deadlines/DeadlineContactsSection.tsx` |
| Service pattern | `src/services/contacts.service.ts` |
| Hook pattern | `src/hooks/useContacts.ts` |
| Query keys | `src/constants/queryKeys.ts` |
| Migration pattern | `supabase/migrations/20251028183835_create_deadline_contacts.sql` |
| Clipboard usage | `src/components/features/deadlines/DisclosureSection.tsx` |

---

## Implementation Order

1. Database & Types (migration, genTypes, constants, types file)
2. Query Keys (add GRAPHICS keys)
3. Service Layer (graphics.service.ts)
4. Hooks (useGraphics.ts)
5. Form Schema (graphicFormSchema.ts)
6. UI Components (GraphicForm, GraphicCard, DeadlineGraphicsSection)
7. Integration (add to deadline detail screen)

---

## Section Order in Deadline View (after implementation)

1. DeadlineHeroSection
2. ReadingProgressUpdate (conditional)
3. ReviewProgressSection
4. ReadingStats (conditional)
5. DailyReadingChart
6. DeadlineContactsSection
7. DeadlineTagsSection
8. **DeadlineGraphicsSection** (new)
9. DisclosureSection (conditional)
10. BookDetailsSection
