-- People (actors, producers, showrunners, script editors, etc.)
CREATE TABLE people (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL
);

-- Eras / Doctor incarnations
-- id is set manually to match the canonical Doctor number (e.g. 1=Hartnell, 10=Tennant, 14=Tennant)
CREATE TABLE eras (
  id          INTEGER PRIMARY KEY,
  actor_id    INTEGER NOT NULL REFERENCES people(id),
  start_year  INTEGER NOT NULL,
  end_year    INTEGER
);

-- Seasons
CREATE TABLE seasons (
  id      SERIAL PRIMARY KEY,
  era_id  INTEGER NOT NULL REFERENCES eras(id),
  number  INTEGER NOT NULL,
  name    TEXT NOT NULL,
  year    INTEGER NOT NULL
);

CREATE TABLE season_producers (
  season_id  INTEGER NOT NULL REFERENCES seasons(id),
  person_id  INTEGER NOT NULL REFERENCES people(id),
  PRIMARY KEY (season_id, person_id)
);

CREATE TABLE season_showrunners (
  season_id  INTEGER NOT NULL REFERENCES seasons(id),
  person_id  INTEGER NOT NULL REFERENCES people(id),
  PRIMARY KEY (season_id, person_id)
);

CREATE TABLE season_script_editors (
  season_id  INTEGER NOT NULL REFERENCES seasons(id),
  person_id  INTEGER NOT NULL REFERENCES people(id),
  PRIMARY KEY (season_id, person_id)
);

-- Arcs (season-long or series-long thematic groupings, can span eras)
CREATE TABLE arcs (
  id     SERIAL PRIMARY KEY,
  title  TEXT NOT NULL
);

-- Stories (groups multi-part episodes; single episodes still have a story)
CREATE TABLE stories (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  era_id     INTEGER NOT NULL REFERENCES eras(id),
  season_id  INTEGER REFERENCES seasons(id)
);

-- Story/arc many-to-many (a story can belong to zero or more arcs)
CREATE TABLE story_arcs (
  story_id  INTEGER NOT NULL REFERENCES stories(id),
  arc_id    INTEGER NOT NULL REFERENCES arcs(id),
  PRIMARY KEY (story_id, arc_id)
);

-- Episodes
CREATE TABLE episodes (
  id           SERIAL PRIMARY KEY,
  story_id     INTEGER NOT NULL REFERENCES stories(id),
  era_id       INTEGER NOT NULL REFERENCES eras(id),   -- denormed from story
  season_id    INTEGER REFERENCES seasons(id),          -- denormed from story
  title        TEXT NOT NULL,
  air_date     DATE,
  part_number  INTEGER
);

-- Episode types (special, christmas-special, minisode, etc.)
CREATE TABLE episode_types (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE episode_type_links (
  episode_id      INTEGER NOT NULL REFERENCES episodes(id),
  episode_type_id INTEGER NOT NULL REFERENCES episode_types(id),
  PRIMARY KEY (episode_id, episode_type_id)
);

-- Characters and appearances
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

-- TVDB
CREATE TABLE tvdb_series (
  id    INTEGER PRIMARY KEY,  -- TVDB's seriesId, e.g. 76107
  name  TEXT NOT NULL
);

CREATE TABLE tvdb_mappings (
  id                   SERIAL PRIMARY KEY,
  episode_id           INTEGER NOT NULL REFERENCES episodes(id),
  tvdb_series_id       INTEGER NOT NULL REFERENCES tvdb_series(id),
  tvdb_episode_id      INTEGER NOT NULL UNIQUE,  -- TVDB's stable episode id
  tvdb_season_number   INTEGER NOT NULL,
  tvdb_episode_number  INTEGER NOT NULL,
  tvdb_absolute_number INTEGER,
  UNIQUE (tvdb_series_id, tvdb_season_number, tvdb_episode_number)
);
