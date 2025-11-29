import { formatProgressDisplay, getUnitForFormat } from './deadlineUtils';

export const getGradientBackground = (
  deadline: {
    id: string | number;
    book_title: string;
    format: 'physical' | 'eBook' | 'audio';
  },
  daysLeft: number
): [string, string] => {
  const gradients: [string, string][] = [
    ['#FF6B6B', '#4DABF7'], // Red to Blue
    ['#9775FA', '#51CF66'], // Purple to Green
    ['#FFD43B', '#FF6B6B'], // Yellow to Red
    ['#4DABF7', '#E599F7'], // Blue to Purple
    ['#51CF66', '#FFB366'], // Green to Orange
    ['#FF8787', '#74C0FC'], // Coral to Sky Blue
    ['#69DB7C', '#F783AC'], // Mint to Pink
    ['#FFB366', '#9775FA'], // Orange to Purple
    ['#E599F7', '#51CF66'], // Lavender to Green
    ['#74C0FC', '#FFD43B'], // Sky Blue to Yellow
    ['#F783AC', '#69DB7C'], // Pink to Mint
    ['#8CE99A', '#A78BFA'], // Light Green to Indigo
    ['#FFE066', '#FB7185'], // Bright Yellow to Rose
    ['#A78BFA', '#FFB366'], // Indigo to Orange
    ['#FB7185', '#74C0FC'], // Rose to Sky Blue
  ];

  const idSeed =
    typeof deadline.id === 'number'
      ? deadline.id
      : parseInt(deadline.id?.toString() || '0', 10) || 0;
  const titleSeed = deadline.book_title
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const daysSeed = daysLeft * 13;
  const formatSeed =
    deadline.format === 'audio'
      ? 137
      : deadline.format === 'physical'
        ? 239
        : 349;
  const dateSeed = new Date().getDate();

  const combinedSeed =
    (titleSeed * 31 + daysSeed * 17 + idSeed * 7 + formatSeed * 3 + dateSeed) %
    10000;
  const index = Math.abs(combinedSeed) % gradients.length;

  return gradients[index];
};

export const formatRemainingDisplay = (
  remaining: number,
  format: 'physical' | 'eBook' | 'audio'
): string => {
  if (remaining <= 0) return 'Complete!';
  const unit = getUnitForFormat(format);
  if (format === 'audio') {
    return `${formatProgressDisplay(format, remaining)} remaining`;
  }
  return `${remaining} ${unit} remaining`;
};

export const formatDailyGoalImpactMessage = (
  currentGoal: number,
  projectedGoal: number,
  format: 'physical' | 'eBook' | 'audio',
  formatGoalFn: (
    units: number,
    format: 'physical' | 'eBook' | 'audio'
  ) => string
): string => {
  const type = format === 'audio' ? 'listening' : 'reading';

  if (currentGoal === 0) {
    const formattedProjected = formatGoalFn(projectedGoal, format);
    return `Starting will set your daily ${type} goal to ${formattedProjected}/day`;
  }

  const formattedCurrent = formatGoalFn(currentGoal, format);
  const formattedProjected = formatGoalFn(projectedGoal, format);
  return `Starting will increase your daily ${type} goal from ${formattedCurrent}→${formattedProjected}/day`;
};

export const formatCapacityMessage = (
  baseMessage: string,
  isNotReading: boolean
): string => {
  if (isNotReading) {
    const cleaned = baseMessage.replaceAll('needed', '');
    return `Will add ${cleaned}`;
  }
  return baseMessage;
};
