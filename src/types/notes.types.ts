import { Tables, TablesInsert, TablesUpdate } from './database.types';

export type DeadlineNote = Tables<'deadline_notes'>;
export type DeadlineNoteInsert = TablesInsert<'deadline_notes'>;
export type DeadlineNoteUpdate = TablesUpdate<'deadline_notes'>;
