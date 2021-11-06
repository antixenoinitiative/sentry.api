Table commands for creating the Database in PostgreSQL

// Create table of systems with a generated ID

CREATE TABLE systems (
  system_id     SERIAL PRIMARY KEY,
  name          VARCHAR(50),
  status        bool,
  presence      int,
  population    bigint,
  coords        text,
  allegiance    text,
  faction       text,
);
CREATE TABLE incursions (
  inc_id            SERIAL PRIMARY KEY,
  system_id         int,
  time              bigint
);
CREATE TABLE presence (
  system_id         int,
  presence_lvl      int,
  time              bigint
);
CREATE TABLE incursionV2 (
  inc_id            SERIAL PRIMARY KEY,
  system_id         int,
  week              int,
  time              bigint,
);

0
1 
2
3
4