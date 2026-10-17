-- Up Migration

-- Source: it's called "Story No." on my Classic Who DVDs
ALTER TABLE stories RENAME COLUMN wiki_number TO story_number;

ALTER TABLE stories RENAME CONSTRAINT stories_wiki_number_key TO stories_story_number_key;

-- Down Migration

ALTER TABLE stories RENAME CONSTRAINT stories_story_number_key TO stories_wiki_number_key;

ALTER TABLE stories RENAME COLUMN story_number TO wiki_number;
