export interface ReleaseNote {
  buildName: string;
  version: string;
  features: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
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
