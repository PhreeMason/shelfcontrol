import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Centralized Day.js configuration
// Add additional plugins here (timezone, relativeTime, etc.)

dayjs.extend(utc);

export { dayjs };
export default dayjs;
