-- ============================================================
-- DREAM ENGLISH SCHOOL — Schema completo (idempotente)
-- Pode ser executado múltiplas vezes sem erros
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================
do $$ begin create type user_role as enum ('ADMIN', 'TEACHER', 'STUDENT');
exception when duplicate_object then null; end $$;

do $$ begin create type enrollment_status as enum ('ACTIVE', 'INACTIVE', 'SUSPENDED');
exception when duplicate_object then null; end $$;

do $$ begin create type payment_status as enum ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin create type homework_status as enum ('DRAFT', 'PUBLISHED', 'CLOSED');
exception when duplicate_object then null; end $$;

do $$ begin create type submission_status as enum ('PENDING', 'SUBMITTED', 'CORRECTED');
exception when duplicate_object then null; end $$;

do $$ begin create type attendance_status as enum ('PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED');
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2. TABELAS
-- ============================================================
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  email text,
  phone text,
  address text,
  logo_url text,
  settings jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  role user_role not null default 'STUDENT',
  full_name text not null,
  email text not null,
  avatar_url text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null default 0,
  billing_cycle text not null default 'monthly',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  specialties text[] not null default '{}',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  plan_id uuid references plans(id) on delete set null,
  enrollment_number text,
  level text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  teacher_id uuid references teachers(id) on delete set null,
  name text not null,
  level text,
  schedule jsonb not null default '[]',
  max_students integer not null default 10,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  status enrollment_status not null default 'ACTIVE',
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, class_id)
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  teacher_id uuid references teachers(id) on delete set null,
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status attendance_status not null default 'ABSENT',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lesson_id, student_id)
);

create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  title text not null,
  description text,
  level text not null,
  order_index integer not null default 0,
  content jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists homework (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  teacher_id uuid references teachers(id) on delete set null,
  title text not null,
  description text,
  instructions text,
  due_date timestamptz,
  status homework_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hw_submissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  homework_id uuid not null references homework(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  content text,
  status submission_status not null default 'PENDING',
  grade numeric(5,2),
  feedback text,
  ai_feedback text,
  submitted_at timestamptz,
  corrected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(homework_id, student_id)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  plan_id uuid references plans(id) on delete set null,
  amount_cents integer not null,
  status payment_status not null default 'PENDING',
  due_date date not null,
  paid_at timestamptz,
  reference_month text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. ÍNDICES
-- ============================================================
create index if not exists idx_profiles_school_id on profiles(school_id);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_students_school_id on students(school_id);
create index if not exists idx_teachers_school_id on teachers(school_id);
create index if not exists idx_classes_school_id on classes(school_id);
create index if not exists idx_lessons_school_scheduled on lessons(school_id, scheduled_at);
create index if not exists idx_payments_school_status on payments(school_id, status);
create index if not exists idx_payments_due_date on payments(due_date);
create index if not exists idx_attendance_school_id on attendance(school_id);
create index if not exists idx_hw_submissions_school_status on hw_submissions(school_id, status);

-- ============================================================
-- 4. UPDATED_AT AUTOMÁTICO
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger set_updated_at before update on schools for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on profiles for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on plans for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on teachers for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on students for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on classes for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on enrollments for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on lessons for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on attendance for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on modules for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on homework for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on hw_submissions for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger set_updated_at before update on payments for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
alter table schools enable row level security;
alter table profiles enable row level security;
alter table plans enable row level security;
alter table teachers enable row level security;
alter table students enable row level security;
alter table classes enable row level security;
alter table enrollments enable row level security;
alter table lessons enable row level security;
alter table attendance enable row level security;
alter table modules enable row level security;
alter table homework enable row level security;
alter table hw_submissions enable row level security;
alter table payments enable row level security;
alter table audit_logs enable row level security;

create or replace function auth_school_id()
returns uuid language sql stable security definer as $$
  select school_id from profiles where id = auth.uid()
$$;

create or replace function auth_role()
returns text language sql stable security definer as $$
  select role::text from profiles where id = auth.uid()
$$;

drop policy if exists "escola própria" on schools;
drop policy if exists "escola própria" on profiles;
drop policy if exists "escola própria" on plans;
drop policy if exists "escola própria" on teachers;
drop policy if exists "escola própria" on students;
drop policy if exists "escola própria" on classes;
drop policy if exists "escola própria" on enrollments;
drop policy if exists "escola própria" on lessons;
drop policy if exists "escola própria" on attendance;
drop policy if exists "escola própria" on modules;
drop policy if exists "escola própria" on homework;
drop policy if exists "escola própria" on hw_submissions;
drop policy if exists "escola própria" on payments;
drop policy if exists "escola própria" on audit_logs;

create policy "escola própria" on schools for all using (id = auth_school_id());
create policy "escola própria" on profiles for all using (school_id = auth_school_id());
create policy "escola própria" on plans for all using (school_id = auth_school_id());
create policy "escola própria" on teachers for all using (school_id = auth_school_id());
create policy "escola própria" on students for all using (school_id = auth_school_id());
create policy "escola própria" on classes for all using (school_id = auth_school_id());
create policy "escola própria" on enrollments for all using (school_id = auth_school_id());
create policy "escola própria" on lessons for all using (school_id = auth_school_id());
create policy "escola própria" on attendance for all using (school_id = auth_school_id());
create policy "escola própria" on modules for all using (school_id = auth_school_id());
create policy "escola própria" on homework for all using (school_id = auth_school_id());
create policy "escola própria" on hw_submissions for all using (school_id = auth_school_id());
create policy "escola própria" on payments for all using (school_id = auth_school_id());
create policy "escola própria" on audit_logs for all using (school_id = auth_school_id());

-- ============================================================
-- 6. SEED: escola + perfil admin
-- ============================================================
do $$
declare
  v_school_id uuid;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users
  where email = 'lucasmaiconj@gmail.com' limit 1;

  if v_user_id is null then
    raise exception 'Usuário não encontrado. Faça login primeiro.';
  end if;

  -- Pula se perfil já existir
  if exists (select 1 from profiles where id = v_user_id) then
    raise notice 'Perfil já existe, seed ignorado.';
    return;
  end if;

  insert into schools (name, slug, email)
  values ('Dream English School', 'dream-english', 'lucasmaiconj@gmail.com')
  returning id into v_school_id;

  insert into profiles (id, school_id, role, full_name, email)
  values (v_user_id, v_school_id, 'ADMIN', 'Admin', 'lucasmaiconj@gmail.com');

  raise notice 'Escola: % | Admin: %', v_school_id, v_user_id;
end;
$$;
