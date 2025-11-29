// Export all services from a single entry point
export { authService } from './auth.service';
export { profileService } from './profile.service';
export { booksService } from './books.service';
export { deadlinesService } from './deadlines.service';
export { storageService } from './storage.service';
export { exportService } from './export.service';
export { notesService } from './notes.service';
export { activityService } from './activity.service';

// Export types
export type {
  SignInParams,
  SignUpParams,
  AppleSignInParams,
} from './auth.service';
export type { UpdateProfileParams, AppleProfileData } from './profile.service';
export type {
  AddDeadlineParams,
  UpdateDeadlineParams,
  UpdateProgressParams,
  DeadlineHistoryParams,
} from './deadlines.service';
export type { ExportResponse, ExportError } from './export.service';
