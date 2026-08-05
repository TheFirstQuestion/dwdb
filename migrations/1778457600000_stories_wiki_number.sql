-- Up Migration

ALTER TABLE stories ADD COLUMN wiki_number TEXT UNIQUE;

-- Down Migration

ALTER TABLE stories DROP COLUMN wiki_number;
