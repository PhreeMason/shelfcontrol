export const PRESET_PLATFORMS = [
  'NetGalley',
  'Goodreads',
  'Amazon',
  'Instagram',
  'TikTok',
  'Twitter/X',
  'Facebook',
  'YouTube',
] as const;

export type PresetPlatform = (typeof PRESET_PLATFORMS)[number];
