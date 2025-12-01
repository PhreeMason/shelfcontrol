export type DeadlineCustomDate = {
  id: string;
  deadline_id: string;
  user_id: string;
  name: string;
  date: string;
  created_at: string;
  updated_at: string;
};

export type DeadlineCustomDateInsert = Omit<
  DeadlineCustomDate,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type DeadlineCustomDateUpdate = {
  name?: string;
  date?: string;
  updated_at?: string;
};
