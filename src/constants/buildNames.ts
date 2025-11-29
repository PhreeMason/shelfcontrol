/**
 * Romance trope build names for ShelfControl releases.
 * Mark as used: true when assigned to a release.
 */

export interface BuildName {
  name: string;
  used: boolean;
}

export const BUILD_NAMES: BuildName[] = [
  // A
  { name: 'Accidental Pregnancy', used: false },
  { name: 'Academy Romance', used: false },
  { name: 'Age Gap', used: false },
  { name: 'Alpha Hero', used: false },
  { name: 'Amnesia', used: true }, // v1.44.0
  { name: 'Arranged Marriage', used: false },

  // B
  { name: "Best Friend's Sibling", used: false },
  { name: 'Bet/Dare', used: false },
  { name: 'Billionaire Romance', used: true }, // v1.50.0
  { name: 'Bodyguard', used: false },
  { name: 'Books & Libraries', used: false },
  { name: "Brother's Best Friend", used: false },

  // C
  { name: 'Cabin in the Woods', used: false },
  { name: 'Childhood Sweethearts', used: true }, // v1.52.0 (current)
  { name: 'Christmas/Holiday Romance', used: false },
  { name: 'Cinderella Story', used: false },
  { name: 'Coffee Shop', used: false },
  { name: 'Cowboy Romance', used: false },
  { name: 'Coworkers', used: false },

  // D
  { name: 'Destined Mates', used: false },
  { name: 'Doctor Romance', used: false },
  { name: 'Divorce/Second Divorce', used: false },

  // E
  { name: 'Employee/Boss', used: false },
  { name: 'Enemies to Lovers', used: false },
  { name: 'Epistolary (Letters/Emails)', used: false },

  // F
  { name: 'Fake Dating', used: false },
  { name: 'Fake Engagement', used: false },
  { name: 'Fake Marriage', used: false },
  { name: 'Fated Mates', used: false },
  { name: 'First Love', used: false },
  { name: 'Forbidden Love', used: false },
  { name: 'Forced Proximity', used: false },
  { name: 'Friends to Lovers', used: false },
  { name: 'Friends with Benefits', used: false },

  // G
  { name: 'Grumpy/Sunshine', used: false },

  // H
  { name: 'Hate to Love', used: false },
  { name: 'Hidden Identity', used: false },
  { name: 'High School Sweethearts', used: false },
  { name: 'Historical Romance', used: false },
  { name: 'Holiday Romance', used: false },

  // I
  { name: 'Instalove', used: false },
  { name: 'Instalust', used: false },

  // J
  { name: 'Jilted Bride/Groom', used: false },

  // K
  { name: 'Kidnapping/Captive', used: false },

  // L
  { name: 'Long Distance Love', used: false },
  { name: 'Lost Love Returns', used: false },
  { name: 'Love at First Sight', used: false },
  { name: 'Love Triangle', used: false },

  // M
  { name: 'Mafia Romance', used: false },
  { name: 'Marriage of Convenience', used: false },
  { name: 'Matchmaker', used: false },
  { name: 'Meet Cute', used: false },
  { name: 'Mentor/Protege', used: false },
  { name: 'Mistaken Identity', used: false },
  { name: 'Music & Bands', used: false },

  // N
  { name: 'Nanny Romance', used: false },
  { name: 'Neighbor Romance', used: false },
  { name: 'New in Town', used: false },

  // O
  { name: 'Office Romance', used: false },
  { name: 'One Bed', used: false },
  { name: 'Only One Bed', used: false },
  { name: 'Opposites Attract', used: false },

  // P
  { name: 'Player Reformed', used: false },
  { name: 'Pregnancy Romance', used: false },
  { name: 'Prince/Princess', used: false },
  { name: 'Protector', used: false },

  // Q
  { name: 'Quiet/Loud', used: false },

  // R
  { name: 'Rake Reformed', used: false },
  { name: 'Redemption Arc', used: false },
  { name: 'Reunion Romance', used: false },
  { name: 'Revenge Plot', used: false },
  { name: 'Reverse Harem', used: false },
  { name: 'Rivals to Lovers', used: false },
  { name: 'Road Trip', used: false },
  { name: 'Rockstar Romance', used: false },
  { name: 'Roommates', used: false },
  { name: 'Royalty Romance', used: false },

  // S
  { name: 'Second Chance', used: false },
  { name: 'Secret Baby', used: false },
  { name: 'Secret Billionaire', used: false },
  { name: 'Secret Identity', used: false },
  { name: 'Secret Relationship', used: false },
  { name: 'Single Parent', used: false },
  { name: 'Small Town', used: false },
  { name: 'Snowed In', used: false },
  { name: 'Sports Romance', used: false },
  { name: 'Star-Crossed Lovers', used: false },
  { name: 'Stranded Together', used: false },
  { name: 'Stuck in Elevator', used: false },

  // T
  { name: 'Teacher/Student', used: false },
  { name: 'Time Travel', used: false },
  { name: 'Touch Her and Die', used: false },
  { name: 'Trapped Together', used: false },
  { name: 'Tutor Romance', used: false },

  // U
  { name: 'Undercover', used: false },
  { name: 'Unexpected Pregnancy', used: false },
  { name: 'Unrequited Love', used: false },

  // V
  { name: 'Vacation Romance', used: false },
  { name: 'Vampire Romance', used: false },
  { name: 'Virgin Hero/Heroine', used: false },

  // W
  { name: 'Wedding Planner', used: false },
  { name: 'Who Did This to You', used: false },
  { name: 'Widow/Widower', used: false },
  { name: 'Workplace Romance', used: false },
  { name: 'Wrong Number', used: false },

  // Y
  { name: 'You Belong With Me', used: false },

  // Z
  { name: 'Zodiac Romance', used: false },
];

export const getAvailableBuildNames = (): string[] =>
  BUILD_NAMES.filter((b) => !b.used).map((b) => b.name);

export const getUsedBuildNames = (): string[] =>
  BUILD_NAMES.filter((b) => b.used).map((b) => b.name);
