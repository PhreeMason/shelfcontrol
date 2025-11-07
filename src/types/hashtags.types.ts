export type Hashtag = {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type HashtagInsert = Omit<
  Hashtag,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type HashtagUpdate = {
  name?: string;
  color?: string;
  updated_at?: string;
};

export type NoteHashtag = {
  id: string;
  note_id: string;
  hashtag_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type NoteHashtagInsert = Omit<
  NoteHashtag,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
