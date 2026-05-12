-- Up Migration
ALTER TABLE seasons ADD CONSTRAINT seasons_era_id_number_key UNIQUE (era_id, number);

-- Down Migration
ALTER TABLE seasons DROP CONSTRAINT seasons_era_id_number_key;
