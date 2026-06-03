-- One-time provisioning of the stats-india database on pg18.
--
-- Run as a Postgres superuser. The Tailscale-routed admin connection is documented in
-- moneytree's deployment guide; sample command (substitute the password from your password manager):
--
--   PGPASSWORD=********** psql \
--       -h pg18.tailce422e.ts.net -p 5432 -U postgres \
--       -f deployment/postgres/create-stats-india-db.sql
--
-- Note: connect to the direct PG port (5432) for DDL — PgBouncer (6432) does not expose
-- DDL session features. Application connections then use 6432 (transaction pooling).

CREATE ROLE stats_india LOGIN PASSWORD 'CHANGEME-stats-india-db-password';

CREATE DATABASE "stats-india"
    OWNER stats_india
    ENCODING 'UTF8'
    LC_COLLATE 'en_US.UTF-8'
    LC_CTYPE 'en_US.UTF-8'
    TEMPLATE template0;

GRANT ALL PRIVILEGES ON DATABASE "stats-india" TO stats_india;

\connect "stats-india"
GRANT ALL ON SCHEMA public TO stats_india;
ALTER SCHEMA public OWNER TO stats_india;
