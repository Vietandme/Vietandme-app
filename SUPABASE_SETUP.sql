-- =============================================
-- VIET & ME — Supabase Database Setup
-- Run this entire script in Supabase SQL Editor
-- =============================================

-- 1. PROFILES TABLE
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  level text default 'beginner',
  role text default 'student',
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 2. FLASHCARDS TABLE
create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  vietnamese text not null,
  english text not null,
  pronunciation text,
  example text,
  level text default 'beginner',
  category text,
  created_at timestamptz default now()
);
alter table flashcards enable row level security;
create policy "Anyone authenticated can view flashcards" on flashcards for select using (auth.role() = 'authenticated');
create policy "Admins can insert flashcards" on flashcards for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete flashcards" on flashcards for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 3. QUIZ QUESTIONS TABLE
create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer text not null,
  level text default 'beginner',
  created_at timestamptz default now()
);
alter table quiz_questions enable row level security;
create policy "Anyone authenticated can view questions" on quiz_questions for select using (auth.role() = 'authenticated');
create policy "Admins can insert questions" on quiz_questions for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete questions" on quiz_questions for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 4. RECORDINGS TABLE
create table if not exists recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  audio_url text not null,
  note text,
  feedback text,
  status text default 'pending',
  created_at timestamptz default now()
);
alter table recordings enable row level security;
create policy "Students can view own recordings" on recordings for select using (auth.uid() = user_id);
create policy "Students can insert own recordings" on recordings for insert with check (auth.uid() = user_id);
create policy "Admins can view all recordings" on recordings for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update recordings" on recordings for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 5. QUIZ RESULTS TABLE
create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  score integer not null,
  total integer not null,
  level text,
  created_at timestamptz default now()
);
alter table quiz_results enable row level security;
create policy "Students can view own results" on quiz_results for select using (auth.uid() = user_id);
create policy "Students can insert own results" on quiz_results for insert with check (auth.uid() = user_id);
create policy "Admins can view all results" on quiz_results for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 6. STORAGE BUCKET FOR AUDIO
insert into storage.buckets (id, name, public) values ('recordings', 'recordings', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload recordings" on storage.objects
  for insert with check (bucket_id = 'recordings' and auth.role() = 'authenticated');

create policy "Public can view recordings" on storage.objects
  for select using (bucket_id = 'recordings');

-- =============================================
-- AFTER RUNNING THIS: 
-- Manually set yourself as admin by running:
-- update profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
-- =============================================
