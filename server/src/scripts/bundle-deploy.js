import fs from 'fs';
import path from 'path';

const m1 = fs.readFileSync('supabase/migrations/20261020_complete_manticao_migration.sql', 'utf8');
const seed = fs.readFileSync('supabase/seed.sql', 'utf8');
const seedAdmin = fs.readFileSync('supabase/seed_admin.sql', 'utf8');

const storageSql = `
-- ==============================================================================
-- STAGE 3: STORAGE BUCKET CONFIGURATION (for ID and Letter of Intent Uploads)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('uploads', 'uploads', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
    CREATE POLICY "Public read uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff manage uploads" ON storage.objects FOR ALL USING (bucket_id = 'uploads');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

const fullSql = [
  '-- ==============================================================================',
  '-- PUBLIC MARKET OF MANTICAO: ALL-IN-ONE MASTER DEPLOYMENT SCRIPT',
  '-- Target: Supabase PostgreSQL (mchqolkwwthnkkctuple.supabase.co)',
  '-- Executes Schema, Migrations, Storage Buckets, Seed Data, and Auth Users',
  '-- ==============================================================================\n',
  m1,
  storageSql,
  '\n-- ==============================================================================\n-- STAGE 4: MARKET & STALL SEED DATA\n-- ==============================================================================\n',
  seed,
  '\n-- ==============================================================================\n-- STAGE 5: MUNICIPAL STAFF AND ACTORS SEED ACCOUNTS\n-- ==============================================================================\n',
  seedAdmin
].join('\n');

fs.writeFileSync('supabase/deploy_all.sql', fullSql, 'utf8');
console.log('Master deploy script created: supabase/deploy_all.sql (' + (fullSql.length / 1024).toFixed(1) + ' KB)');
