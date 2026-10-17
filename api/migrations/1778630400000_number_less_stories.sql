-- Up Migration

-- story_number is UNIQUE, which permits many NULLs. Number-less stories (minisodes etc.) need their own identity: (title, era_id).
CREATE UNIQUE INDEX stories_number_less_title_era_key
  ON stories (title, era_id)
  WHERE story_number IS NULL;

-- Down Migration

DROP INDEX stories_number_less_title_era_key;
