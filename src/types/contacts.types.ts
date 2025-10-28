export type DeadlineContact = {
  id: string;
  deadline_id: string;
  user_id: string;
  contact_name: string | null;
  email: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
};

export type DeadlineContactInsert = Omit<
  DeadlineContact,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type DeadlineContactUpdate = {
  contact_name?: string | null;
  email?: string | null;
  username?: string | null;
  updated_at?: string;
};
