-- Schema
CREATE TABLE users (id int);

CREATE FUNCTION active() RETURNS int AS $$ SELECT 1 $$ LANGUAGE sql;
SELECT id FROM users WHERE id > 0;
