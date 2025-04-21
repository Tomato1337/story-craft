CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type varchar NOT NULL,
  content_id uuid NOT NULL,
  reaction_type varchar NOT NULL,
  created_at timestamp NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_reaction UNIQUE(user_id, content_type, content_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid NOT NULL,
  content_type varchar NOT NULL,
  content_id uuid NOT NULL,
  parent_id uuid REFERENCES comments(id),
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_content ON reactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);