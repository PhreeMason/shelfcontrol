export interface ReleaseNote {
  buildName: string;
  version: string;
  features: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    buildName: 'Fated Mates',
    version: '1.58.5',
    features: [
      'Fixed calendar showing custom dates one day off',
      'Fixed progress input when entering percentages',
      'Clarified that Pending and Applied are the same status',
      'Fixed a bug preventing profile picture uploading',
    ],
  },
  {
    buildName: 'Fated Mates',
    version: '1.58.0',
    features: [
      'Custom dates on your calendar',
      'Book covers in calendar view',
      'Audiobook data autopopulates',
      'Enhanced calendar styling and filters',
    ],
  },
  {
    buildName: 'Enemies to Lovers',
    version: '1.54.0',
    features: [
      'Mark ARCs as applied when adding books',
      'Safer account and data deletion with extra confirmation',
      'Fixed navigation bug on book details page',
      'Bug fixes and performance improvements',
    ],
  },
  {
    buildName: 'Doctor Romance',
    version: '1.53.2',
    features: [
      'Data & Privacy settings with account deletion',
      'Improved password reset flow',
      'Better navigation after deleting a book',
      'Style improvements and bug fixes',
    ],
  },
  {
    buildName: 'Childhood Sweethearts',
    version: '1.52.0',
    features: [
      'Filter your calendar by activity, or due dates only',
      'See how adding a book impacts your reading pace',
      'Over-the-air updates for faster fixes',
      'Better review tracking with clearer messaging',
      'Bug fixes and performance improvements',
    ],
  },
  {
    buildName: 'Billionaire Romance',
    version: '1.50.0',
    features: [
      'Simplified due date form for faster book entry',
      'Quick add buttons are back',
      'Update your book cover images anytime',
      'Improved daily reading chart',
      'Bug fixes and performance improvements',
    ],
  },
  {
    buildName: 'Amnesia',
    version: '1.44.0',
    features: [
      'Hashtag filtering for your notes',
      'New Stats and Calendar tabs',
      'Pages read per day line chart',
      '"Deadline" renamed to "due date" throughout',
      'Bug fixes and performance improvements',
    ],
  },
];

export const getCurrentRelease = (): ReleaseNote => RELEASE_NOTES[0];

export const getPreviousReleases = (): ReleaseNote[] => RELEASE_NOTES.slice(1);

export const getRecentPreviousReleases = (limit: number = 2): ReleaseNote[] =>
  RELEASE_NOTES.slice(1, limit + 1);

export const getAllPreviousReleases = (): ReleaseNote[] =>
  RELEASE_NOTES.slice(1);
