-- Create enum types for the application

-- Book format enum
CREATE TYPE book_format_enum AS ENUM (
  'physical',
  'ebook', 
  'audio'
);

-- Deadline flexibility enum
CREATE TYPE deadline_flexibility AS ENUM (
  'flexible',
  'strict'
);

-- Deadline status enum
CREATE TYPE deadline_status_enum AS ENUM (
  'requested',
  'approved', 
  'reading',
  'rejected',
  'withdrew',
  'complete',
  'set_aside'
);