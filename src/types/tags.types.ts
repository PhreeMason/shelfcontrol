export type Tag = {
  id: string;
  name: string;
  color: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TagInsert = Omit<Tag, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TagUpdate = {
  name?: string;
  color?: string;
  updated_at?: string;
};

export type DeadlineTag = {
  id: string;
  deadline_id: string;
  tag_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type DeadlineTagInsert = Omit<
  DeadlineTag,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TagWithDetails = Tag & {
  isSystemTag: boolean;
};
