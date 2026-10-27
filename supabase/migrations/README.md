# Supabase Database Setup

Use **one SQL file** for a fresh database setup or a full schema refresh:

- [`supabase/deploy_all.sql`](../deploy_all.sql)

It contains the schema, workflow fields, Mayor-first approval states, payment and receipt metadata, stall assignment records, activation triggers, seed/configuration statements, and permissions in one script. Run it from the Supabase SQL Editor. Review the target project before running because the script also configures permissions and seed data.

The files in this `migrations/` directory are retained as migration history and targeted upgrade references. Do not run them one by one when using the consolidated script.