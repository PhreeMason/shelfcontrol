# Mood Tracking Implementation Plan

**Status**: 🚧 In Progress
**Started**: 2025-01-19
**Target Completion**: 5-7 days

## Overview
Add mood tracking feature allowing users to record emotional reactions while reading. Moods display chronologically with notes on the notes page, creating a unified reading journal timeline.

## Key Design Decisions
- **Table name**: `moods` (generic for future expansion beyond deadlines)
- **Display**: Moods shown inline with notes on notes page, sorted by `created_at`
- **Editing**: Delete only (no editing after creation)
- **Selection**: Unlimited emoji selection (no max)
- **Timeline**: Unified notes + moods sorted chronologically

---

## Implementation Progress

### Phase 1: Database & Types (Day 1)
- [ ] 1. Create `moods` table (Supabase migration)
  - [ ] Create migration file with schema
  - [ ] Add indexes (user_id, deadline_id, created_at)
  - [ ] Add RLS policies
  - [ ] Add foreign keys (deadline_id, note_id)
  - [ ] Run migration in development

- [ ] 2. Run `npm run genTypes` to regenerate database types

- [ ] 3. Create `src/types/moods.types.ts`
  - [ ] Define `MoodEmoji` type
  - [ ] Define `MOOD_EMOJI_MAP` constant (17 emojis)
  - [ ] Export `Mood`, `MoodInsert` types
  - [ ] Define `TimelineEntry` union type

- [ ] 4. Add QUERY_KEYS.MOODS to `src/constants/queryKeys.ts`
  - [ ] Add MOODS.BY_DEADLINE key
  - [ ] Add MUTATION_KEYS.MOODS (ADD, DELETE)

### Phase 2: Service Layer (Day 1-2)
- [ ] 5. Create `src/services/moods.service.ts`
  - [ ] Implement `getMoods(userId, deadlineId)`
  - [ ] Implement `addMood()` with progress calculation
  - [ ] Implement `deleteMood(userId, moodId)`
  - [ ] Add proper error handling
  - [ ] Add JSDoc comments

- [ ] 6. Write service tests `src/services/__tests__/moods.service.test.ts`
  - [ ] Test getMoods() for correct user/deadline
  - [ ] Test addMood() progress calculation
  - [ ] Test addMood() with/without comment
  - [ ] Test addMood() with/without noteId
  - [ ] Test deleteMood() authorization
  - [ ] Achieve 90%+ coverage

- [ ] 7. Update `src/services/README.md`
  - [ ] Document moods service API
  - [ ] Add example usage

### Phase 3: Hooks Layer (Day 2)
- [ ] 8. Create `src/hooks/useMoods.ts`
  - [ ] Implement `useGetMoods(deadlineId)`
  - [ ] Implement `useAddMood()` mutation
  - [ ] Implement `useDeleteMood()` mutation
  - [ ] Add cache invalidation logic
  - [ ] Add analytics tracking

- [ ] 9. Write hook tests `src/hooks/__tests__/useMoods.test.ts`
  - [ ] Test query hook fetches correctly
  - [ ] Test mutations invalidate cache
  - [ ] Test error handling

### Phase 4: UI Components (Day 3-4)
- [ ] 10. Create `src/components/features/moods/MoodSelector.tsx`
  - [ ] Build responsive emoji grid (4 columns)
  - [ ] Implement multi-select toggle behavior
  - [ ] Add visual selection indicators
  - [ ] Use theme tokens for styling
  - [ ] Add accessibility labels

- [ ] 11. Create `src/components/features/moods/DeadlineMoodSection.tsx`
  - [ ] Build expandable section header
  - [ ] Add MoodSelector integration
  - [ ] Add optional comment TextInput
  - [ ] Add Save button with loading state
  - [ ] Implement collapse after save
  - [ ] Add success feedback

- [ ] 12. Modify `src/app/deadline/[id]/notes.tsx`
  - [ ] Import useMoods hook
  - [ ] Fetch both notes and moods
  - [ ] Merge and sort timeline by created_at
  - [ ] Add type discriminator for rendering
  - [ ] Create mood entry display component
  - [ ] Add delete functionality with confirmation
  - [ ] Update FlatList to render timeline

- [ ] 13. Modify `src/app/deadline/[id]/index.tsx`
  - [ ] Import DeadlineMoodSection
  - [ ] Add after ReadingProgressUpdate
  - [ ] Pass deadline prop

- [ ] 14. Write component tests
  - [ ] Test MoodSelector multi-select
  - [ ] Test DeadlineMoodSection expand/collapse
  - [ ] Test notes page timeline integration
  - [ ] Test mood entry display
  - [ ] Test delete confirmation

### Phase 5: Analytics & Integration (Day 4-5)
- [ ] 15. Add analytics tracking
  - [ ] Track `mood_added` event
  - [ ] Track `mood_deleted` event
  - [ ] Include relevant metadata

- [ ] 16. Integration testing
  - [ ] Test mood creation flow
  - [ ] Test mood appears in timeline
  - [ ] Test mood deletion
  - [ ] Test timeline sorting
  - [ ] Test progress calculation
  - [ ] Test empty states

### Phase 6: Testing & Polish (Day 5-6)
- [ ] 17. Run full test suite
  - [ ] `npm run test:coverage` (90%+ target)
  - [ ] `npm run lint && npm run typecheck`
  - [ ] Fix any errors

- [ ] 18. Manual testing checklist
  - [ ] Can select/deselect unlimited emojis
  - [ ] Can add mood with comment
  - [ ] Can add mood without comment
  - [ ] Progress % calculated correctly
  - [ ] Mood appears in correct timeline position
  - [ ] Timeline sorts correctly
  - [ ] Delete shows confirmation
  - [ ] Empty states work
  - [ ] Works on iOS
  - [ ] Works on Android
  - [ ] Edge cases handled (0%, 100%, no progress)

- [ ] 19. Update this document
  - [ ] Mark all tasks complete
  - [ ] Document any deviations
  - [ ] Add screenshots/examples
  - [ ] Update README if needed

---

## Technical Implementation Details

### Database Schema
```sql
CREATE TABLE moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deadline_id UUID NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
  mood_emojis TEXT[] NOT NULL CHECK (array_length(mood_emojis, 1) > 0),
  comment TEXT,
  deadline_progress INTEGER NOT NULL,
  note_id UUID REFERENCES deadline_notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moods_user_id ON moods(user_id);
CREATE INDEX idx_moods_deadline_id ON moods(deadline_id);
CREATE INDEX idx_moods_created_at ON moods(created_at);

-- RLS Policies
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own moods"
  ON moods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own moods"
  ON moods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own moods"
  ON moods FOR DELETE
  USING (auth.uid() = user_id);
```

### Emoji Mappings
```typescript
// src/types/moods.types.ts
export const MOOD_EMOJI_MAP = {
  // Positive (9)
  swooning: '😍',
  butterflies: '🦋',
  intense: '🔥',
  thrilled: '😃',
  mind_blown: '🤯',
  hilarious: '🤣',
  crying_happy: '😭',
  steamy: '🥵',
  warm_fuzzy: '🥰',

  // Negative (4)
  irritated: '😠',
  bored: '🥱',
  tense: '😬',
  worried: '😟',

  // Neutral (4)
  meh: '😐',
  intrigued: '🤔',
  teary: '😢',
  sleepy: '😴',
} as const;

export type MoodEmoji = keyof typeof MOOD_EMOJI_MAP;
```

### Timeline Merging Pattern
```typescript
// In notes.tsx - fetch both data sources
const { data: notes } = useGetNotes(deadlineId);
const { data: moods } = useGetMoods(deadlineId);

// Create unified timeline
const timeline: TimelineEntry[] = [
  ...notes.map(n => ({ type: 'note', data: n, timestamp: n.created_at })),
  ...moods.map(m => ({ type: 'mood', data: m, timestamp: m.created_at })),
].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Newest first

// Render with type discrimination
timeline.map(entry =>
  entry.type === 'note' ? <NoteCard /> : <MoodCard />
)
```

### Progress Snapshot Pattern (Mirror Notes)
```typescript
// In moods.service.ts addMood()
// 1. Fetch latest progress
const { data: progressData } = await supabase
  .from('deadline_progress')
  .select('current_progress')
  .eq('deadline_id', deadlineId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

// 2. Fetch total quantity
const { data: deadline } = await supabase
  .from('deadlines')
  .select('total_quantity')
  .eq('id', deadlineId)
  .single();

// 3. Calculate percentage
const percentage = Math.round((progressData.current_progress / deadline.total_quantity) * 100);

// 4. Store with mood
await supabase.from('moods').insert({
  user_id: userId,
  deadline_id: deadlineId,
  mood_emojis: moodEmojis,
  comment: comment,
  deadline_progress: percentage,
  note_id: noteId,
});
```

---

## Files to Create

### New Files
1. `supabase/migrations/[timestamp]_create_moods_table.sql`
2. `src/types/moods.types.ts`
3. `src/services/moods.service.ts`
4. `src/services/__tests__/moods.service.test.ts`
5. `src/hooks/useMoods.ts`
6. `src/hooks/__tests__/useMoods.test.ts`
7. `src/components/features/moods/MoodSelector.tsx`
8. `src/components/features/moods/DeadlineMoodSection.tsx`
9. `src/components/features/moods/__tests__/MoodSelector.test.tsx`
10. `src/components/features/moods/__tests__/DeadlineMoodSection.test.tsx`

### Files to Modify
1. `src/constants/queryKeys.ts` - Add MOODS query keys
2. `src/app/deadline/[id]/index.tsx` - Add DeadlineMoodSection
3. `src/app/deadline/[id]/notes.tsx` - Timeline integration
4. `src/services/README.md` - Document moods service

---

## Architecture Patterns to Follow

### Service → Hook → Component Flow
```
Component (DeadlineMoodSection)
  ↓ useAddMood()
Hook Layer (useMoods.ts)
  ↓ moodsService.addMood()
Service Layer (moods.service.ts)
  ↓ Supabase Client
Database (moods table)
```

### React Query Cache Invalidation
```typescript
// After adding mood, invalidate both moods AND notes
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.MOODS.BY_DEADLINE(userId, deadlineId),
});
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.NOTES.BY_DEADLINE(userId, deadlineId),
});
```

### Testing Requirements
- **Services**: 90%+ coverage (follow `notes.service.test.ts` pattern)
- **Hooks**: Test query/mutation behavior (follow `useNotes.test.ts` pattern)
- **Components**: Integration tests for user flows (follow `DeadlineFormStep1.test.tsx` pattern)

### Theming Requirements
- Use `Typography` tokens for text sizes
- Use `Spacing` tokens for margins/padding
- Use `BorderRadius` tokens for rounded corners
- Use `Shadows` tokens for elevation
- Use `useTheme()` hook for colors

### Language Guidelines
- Use "How are you feeling?" not "Track your mood"
- Use "Jot down thoughts" for comment field
- Use casual, helpful tone (reference LANGUAGE_GUIDE.md)

---

## Success Criteria
- [ ] Users can select unlimited emojis per mood
- [ ] Optional comment field works
- [ ] Progress % captured automatically
- [ ] Moods display chronologically with notes
- [ ] Delete functionality works with confirmation
- [ ] No editing capability (delete only)
- [ ] All tests passing (90%+ coverage on new files)
- [ ] Analytics events tracked
- [ ] Follows service → hook → component pattern
- [ ] Uses theme tokens for styling
- [ ] User-friendly language (LANGUAGE_GUIDE.md compliance)
- [ ] Timeline sorts correctly (newest first when inverted)
- [ ] Works on iOS and Android

---

## Notes & Decisions

### Design Decisions
- **Why text[] for mood_emojis**: Allows querying, analytics, and avoids emoji encoding issues
- **Why no max emojis**: User freedom to express complex emotions
- **Why delete-only**: Moods are snapshots in time, editing would lose historical accuracy
- **Why timeline integration**: Creates unified reading journal experience

### Questions Resolved
- ✅ Table name: `moods` (generic for future expansion)
- ✅ Editing: Delete only, no editing
- ✅ Max emojis: Unlimited selection
- ✅ Display location: Notes page timeline (not separate history)
- ✅ MoodEntry component: Not needed, render inline on notes page

### Future Enhancements (Not in Scope)
- Mood analytics/insights (e.g., "Most common mood: 🔥")
- Mood trends over time visualization
- Export moods with notes
- Filter timeline by mood
- Add custom mood emojis

---

## Implementation Log

### Session 1 (2025-01-19)
- ✅ Created implementation plan
- ✅ Approved by stakeholder
- ✅ Created MOOD_TRACKING.md tracking document
- 🚧 Next: Start Phase 1 (Database & Types)

### Session 2 (TBD)
- [ ] _Work to be logged here_

### Session 3 (TBD)
- [ ] _Work to be logged here_

---

**Last Updated**: 2025-01-19
**Next Session Goal**: Complete Phase 1 (Database & Types)
