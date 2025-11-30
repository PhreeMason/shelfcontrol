/**
 * trope build names for ShelfControl releases.
 * Mark as used: true when assigned to a release.
 */

export interface BuildName {
  name: string;
  used: boolean;
}

export const BUILD_NAMES: BuildName[] = [
  // A
  { name: 'Academy Romance', used: false },
  { name: 'Acquired Superpowers', used: false },
  { name: 'Age Gap', used: false },
  { name: 'Alchemy', used: false },
  { name: 'Alpha Hero', used: false },
  { name: 'Amnesia', used: true }, // v1.44.0
  { name: 'Ancient Magic', used: false },
  { name: 'Animal Familiars', used: false },
  { name: 'Animal Guides', used: false },
  { name: 'Arranged Marriage', used: false },
  { name: 'Assassins', used: false },
  { name: 'Assassins Guild', used: false },

  // B
  { name: "Best Friend's Sibling", used: false },
  { name: 'Bet/Dare', used: false },
  { name: 'Billionaire Romance', used: true }, // v1.50.0
  { name: 'Black Magic', used: false },
  { name: 'Blood Curse', used: false },
  { name: 'Bodyguard', used: false },
  { name: 'Book of Spells', used: false },
  { name: 'Books & Libraries', used: false },
  { name: "Brother's Best Friend", used: false },

  // C
  { name: 'Cabin in the Woods', used: false },
  { name: 'Call to Adventure', used: false },
  { name: 'Childhood Sweethearts', used: true }, // v1.52.0 (current)
  { name: 'Chosen One', used: false },
  { name: 'Christmas/Holiday Romance', used: false },
  { name: 'Cinderella Story', used: false },
  { name: 'Coffee Shop', used: false },
  { name: 'Coming of Age', used: false },
  { name: 'Coworkers', used: false },
  { name: 'Crown Prince in Hiding', used: false },

  // D
  { name: 'Damsels in Distress', used: false },
  { name: 'Dark Academia', used: false },
  { name: 'Dark Caves', used: false },
  { name: 'Dark Elves', used: false },
  { name: 'Dark Lord', used: false },
  { name: 'Demonic Creatures', used: false },
  { name: 'Demons', used: false },
  { name: 'Destined Mates', used: false },
  { name: 'Destroy the Artifact', used: false },
  { name: 'Diplomatic Marriage', used: false },
  { name: 'Discovering Powers', used: false },
  { name: 'Distracted by Love', used: false },
  { name: 'Doctor Romance', used: true }, // v1.53.0
  { name: 'Dragon Rider Bond', used: false },
  { name: 'Dragons', used: false },
  { name: 'Dual Wielding', used: false },
  { name: 'Dwarves', used: false },

  // E
  { name: 'Elves', used: false },
  { name: 'Elves and Dwarves', used: false },
  { name: 'Employee/Boss', used: false },
  { name: 'Enchanted Object', used: false },
  { name: 'Enchanted Sleep', used: false },
  { name: 'Enemies to Lovers', used: false },
  { name: 'Epistolary', used: false },
  { name: 'Evil Overlord', used: false },
  { name: 'Evil Rulers', used: false },
  { name: 'Evil Wizards', used: false },

  // F
  { name: 'Fae Bargain', used: false },
  { name: 'Faes', used: false },
  { name: 'Fairy Godmother', used: false },
  { name: 'Fake Dating', used: false },
  { name: 'Fake Engagement', used: false },
  { name: 'Fake Marriage', used: false },
  { name: 'Fated Mates', used: false },
  { name: 'Final Showdown', used: false },
  { name: 'First Love', used: false },
  { name: 'Fish Out of Water', used: false },
  { name: 'Floating Castles', used: false },
  { name: 'Floating Islands', used: false },
  { name: 'Forbidden Forest', used: false },
  { name: 'Forbidden Love', used: false },
  { name: 'Forbidden Magic', used: false },
  { name: 'Forced Proximity', used: false },
  { name: 'Found Family', used: false },
  { name: 'Friends to Lovers', used: false },

  // G
  { name: 'Gnomes', used: false },
  { name: 'Goblins', used: false },
  { name: 'Gods and Goddesses', used: false },
  { name: 'Good vs Evil', used: false },
  { name: 'Good Wizards', used: false },
  { name: 'Group of Misfits', used: false },
  { name: 'Grumpy/Sunshine', used: false },
  { name: 'Guardian Animals', used: false },
  { name: 'Guardian Protector', used: false },

  // H
  { name: 'Halflings', used: false },
  { name: 'Hate to Love', used: false },
  { name: 'Haunted Castle', used: false },
  { name: 'Healing Magic', used: false },
  { name: 'Heir to the Throne', used: false },
  { name: 'Hell and Heaven', used: false },
  { name: "Hero's Journey", used: false },
  { name: 'Hidden Heir', used: false },
  { name: 'Hidden Identity', used: false },
  { name: 'Hidden Magic', used: false },
  { name: 'Hidden Treasure', used: false },
  { name: 'High School Sweethearts', used: false },
  { name: 'Historical Romance', used: false },
  { name: 'Holiday Romance', used: false },
  { name: 'Horses', used: false },

  // I
  { name: 'Instalove', used: false },
  { name: 'Instalust', used: false },
  { name: 'Intergenerational Trauma', used: false },
  { name: 'Invisibility Cloaks', used: false },

  // K
  { name: 'King in Exile', used: false },
  { name: "King's Right Hand", used: false },
  { name: 'Kingdoms', used: false },

  // L
  { name: 'Legendary Creatures', used: false },
  { name: 'Lost Heir', used: false },
  { name: 'Lost Princess', used: false },
  { name: 'Lucky Novice', used: false },
  { name: 'Long Distance Love', used: false },
  { name: 'Lost Love Returns', used: false },
  { name: 'Love at First Sight', used: false },
  { name: 'Love Triangle', used: false },

  // M
  { name: 'Mafia Romance', used: false },
  { name: 'Magic Potions', used: false },
  { name: 'Magic Rings', used: false },
  { name: 'Magic Swords', used: false },
  { name: 'Magic Wielder', used: false },
  { name: 'Magical Academy', used: false },
  { name: 'Magical Creatures', used: false },
  { name: 'Magicians Guild', used: false },
  { name: 'Marriage of Convenience', used: false },
  { name: 'Matchmaker', used: false },
  { name: 'Meet Cute', used: false },
  { name: 'Mentor/Protege', used: false },
  { name: 'Mistaken Identity', used: false },
  { name: 'Monsters', used: false },
  { name: 'Morally Gray Hero', used: false },
  { name: 'Mystical Forest', used: false },
  { name: 'Myths and Legends', used: false },

  // N
  { name: 'Nanny Romance', used: false },
  { name: 'Nature Magic', used: false },
  { name: 'Necromancy', used: false },
  { name: 'Neighbor Romance', used: false },
  { name: 'New in Town', used: false },
  { name: 'Next Generation', used: false },
  { name: 'Nobility', used: false },
  { name: 'Notorious Villain', used: false },

  // O
  { name: 'Office Romance', used: false },
  { name: 'Old Allies', used: false },
  { name: 'Old Man Mentor', used: false },
  { name: 'One Bed', used: false },
  { name: 'Opposites Attract', used: false },
  { name: 'Orcs', used: false },
  { name: 'Orphan Hero', used: false },
  { name: 'Outcast Mage', used: false },
  { name: 'Outlaw', used: false },

  // P
  { name: 'Point of No Return', used: false },
  { name: 'Portal Fantasy', used: false },
  { name: 'Potions', used: false },
  { name: 'Powerful Artifacts', used: false },
  { name: 'Price for Winning', used: false },
  { name: 'Princess', used: false },
  { name: 'Prophecy Child', used: false },
  { name: 'Protector', used: false },
  { name: 'Pseudo-Medieval Setting', used: false },
  { name: 'Pure Evil', used: false },

  // Q
  { name: 'Quest Companions', used: false },
  { name: 'Quest for Immortality', used: false },
  { name: 'Quests', used: false },

  // R
  { name: 'Rags to Riches', used: false },
  { name: 'Rally the Troops', used: false },
  { name: 'Redemption Arc', used: false },
  { name: 'Refusal of the Call', used: false },
  { name: 'Reincarnated from the Gods', used: false },
  { name: 'Reluctant Hero', used: false },
  { name: 'Resurrection', used: false },
  { name: 'Reunion Romance', used: false },
  { name: 'Revenge Plot', used: false },
  { name: 'Reverse Harem', used: false },
  { name: 'Rivals to Lovers', used: false },
  { name: 'Road Back Home', used: false },
  { name: 'Road Trip', used: false },
  { name: 'Rockstar Romance', used: false },
  { name: 'Roommates', used: false },
  { name: 'Royal Court', used: false },
  { name: 'Royal in Disguise', used: false },
  { name: 'Royalty Joins Crew', used: false },
  { name: 'Royalty Romance', used: false },

  // S
  { name: 'Second Chance', used: false },
  { name: 'Secret Baby', used: false },
  { name: 'Secret Billionaire', used: false },
  { name: 'Secret Heir', used: false },
  { name: 'Secret Identity', used: false },
  { name: 'Secret Lair', used: false },
  { name: 'Secret Library', used: false },
  { name: 'Secret Relationship', used: false },
  { name: 'Secret Royalty', used: false },
  { name: 'Sentient Weapons', used: false },
  { name: 'Shapeshifting', used: false },
  { name: 'Shelves with Benefits', used: false },
  { name: 'Shield-Maiden', used: false },
  { name: 'Side Quests', used: false },
  { name: 'Single Parent', used: false },
  { name: 'Slow Burn', used: false },
  { name: 'Small Town', used: false },
  { name: 'Snowed In', used: false },
  { name: 'Society Stopped in Time', used: false },
  { name: 'Solve the Puzzle', used: false },
  { name: 'Soulmates', used: false },
  { name: 'Spaceships', used: false },
  { name: 'Sports Romance', used: false },
  { name: 'Sprawling Libraries', used: false },
  { name: 'Star-Crossed Lovers', used: false },
  { name: 'Stranded Together', used: false },
  { name: 'Stuck in Elevator', used: false },
  { name: 'Supreme Ruler', used: false },
  { name: 'Swordsperson', used: false },

  // T
  { name: 'Talking Animals', used: false },
  { name: 'Tavern Owner', used: false },
  { name: 'Taverns', used: false },
  { name: 'Teacher/Student', used: false },
  { name: 'The Antihero', used: false },
  { name: 'The Bard', used: false },
  { name: 'The Eagles', used: false },
  { name: 'The Good Samaritan', used: false },
  { name: 'The Loner', used: false },
  { name: 'The Mentor', used: false },
  { name: 'The Next Adventure', used: false },
  { name: 'The Parental Figure', used: false },
  { name: 'The Price to Pay', used: false },
  { name: 'The Prophecy', used: false },
  { name: 'The Reward', used: false },
  { name: 'Thieves Guild', used: false },
  { name: 'Throne Rivals', used: false },
  { name: 'Time Travel', used: false },
  { name: 'Touch Her and Die', used: false },
  { name: 'Training Arc', used: false },
  { name: 'Trapped Together', used: false },
  { name: 'Travelling Parties', used: false },
  { name: 'Trolls', used: false },
  { name: 'True Names', used: false },
  { name: 'Tutor Romance', used: false },

  // U
  { name: 'Under a Spell', used: false },
  { name: 'Undercover', used: false },
  { name: 'Undercover Royal', used: false },
  { name: 'Unicorns', used: false },
  { name: 'Unlikely Allies', used: false },

  // V
  { name: 'Vacation Romance', used: false },
  { name: 'Vampire Romance', used: false },
  { name: 'Villain Origin', used: false },
  { name: 'Villain Redemption', used: false },
  { name: 'Vampires', used: false },

  // W
  { name: 'Wedding Planner', used: false },
  { name: 'Werewolves', used: false },
  { name: 'Wicked Bargain', used: false },
  { name: 'Wish Magic', used: false },
  { name: 'Witch Hunter', used: false },
  { name: 'Workplace Romance', used: false },
  { name: "World's Worst Spellcaster", used: false },
  { name: 'Wrong Number', used: false },

  // X
  { name: 'X Marks the Spot', used: false },

  // Y
  { name: 'You Belong With Me', used: false },

  // Z
  { name: 'Zero to Hero', used: false },
  { name: 'Zodiac Romance', used: false },
];

export const getAvailableBuildNames = (): string[] =>
  BUILD_NAMES.filter(b => !b.used).map(b => b.name);

export const getUsedBuildNames = (): string[] =>
  BUILD_NAMES.filter(b => b.used).map(b => b.name);
