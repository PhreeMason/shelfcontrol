export const TAG_COLOR_PALETTE = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#6366f1',
  '#14b8a6',
  '#f97316',
  '#a855f7',
] as const;

export const getNextTagColor = (existingTags: { color: string }[]): string => {
  if (existingTags.length === 0) {
    return TAG_COLOR_PALETTE[0];
  }

  const usedColors = new Set(existingTags.map(tag => tag.color));
  const availableColors = TAG_COLOR_PALETTE.filter(
    color => !usedColors.has(color)
  );

  if (availableColors.length > 0) {
    return availableColors[0];
  }

  return TAG_COLOR_PALETTE[existingTags.length % TAG_COLOR_PALETTE.length];
};
