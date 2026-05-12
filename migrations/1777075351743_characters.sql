CREATE TABLE characters (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL
);

CREATE TABLE character_actor_links (
  character_id  INTEGER NOT NULL REFERENCES characters(id),
  actor_id      INTEGER NOT NULL REFERENCES people(id),
  PRIMARY KEY (character_id, actor_id)
);

CREATE TABLE episode_character_links (
  episode_id    INTEGER NOT NULL REFERENCES episodes(id),
  character_id  INTEGER NOT NULL REFERENCES characters(id),
  actor_id      INTEGER NOT NULL REFERENCES people(id),
  PRIMARY KEY (episode_id, character_id)
);
