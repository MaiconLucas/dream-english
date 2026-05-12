-- ============================================================
-- DREAM ENGLISH SCHOOL — Migração 002: Conteúdo das Aulas
-- Módulos, Lições estruturadas e Progresso do Aluno
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type lesson_status as enum ('DRAFT', 'PUBLISHED');
exception when duplicate_object then null; end $$;

-- ============================================================
-- TABELAS
-- ============================================================

-- Módulos (ex: Foundation — Earth, Foundation — Fire)
create table if not exists course_modules (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  title         text not null,
  description   text,
  cefr_level    text not null default 'A1',
  order_index   integer not null default 0,
  is_published  boolean not null default false,
  created_by    uuid references teachers(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Lições dentro de cada módulo
create table if not exists course_lessons (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id) on delete cascade,
  module_id         uuid not null references course_modules(id) on delete cascade,
  teacher_id        uuid references teachers(id) on delete set null,
  order_index       integer not null default 0,
  status            lesson_status not null default 'DRAFT',

  -- Cabeçalho da lição
  title             text not null,
  grammar_focus     text,
  duration_min      integer not null default 50,
  cefr_level        text not null default 'A1',

  -- Objetivos da aula (array de strings)
  -- ex: ["Speak: Introduce yourself", "Grammar: Use am/is/are correctly"]
  objectives        jsonb not null default '[]',

  -- Teoria gramatical
  -- { explanation: text, tip: text, rows: [{col1, col2, col3}], headers: [text] }
  theory            jsonb not null default '{}',

  -- Atividade principal (jogo ou música fill-the-gap)
  -- { type: "game"|"song", title, duration_min, instructions, examples: [text] }
  activity          jsonb not null default '{}',

  -- Exercício de música com lacunas
  -- { song_title, artist, verses: [{text, blank_word}], discussion_questions: [text] }
  song_exercise     jsonb not null default '{}',

  -- Homework
  homework_text     text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Perguntas de conversação de cada lição (10 por lição)
create table if not exists lesson_questions (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  lesson_id   uuid not null references course_lessons(id) on delete cascade,
  order_index integer not null default 0,
  emoji       text,
  question    text not null,
  follow_up   text,
  created_at  timestamptz not null default now()
);

-- Progresso do aluno na trilha (desbloqueio lição a lição)
create table if not exists lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  student_id   uuid not null references students(id) on delete cascade,
  lesson_id    uuid not null references course_lessons(id) on delete cascade,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(student_id, lesson_id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_course_modules_school on course_modules(school_id, order_index);
create index if not exists idx_course_lessons_module on course_lessons(module_id, order_index);
create index if not exists idx_course_lessons_teacher on course_lessons(teacher_id);
create index if not exists idx_lesson_questions_lesson on lesson_questions(lesson_id, order_index);
create index if not exists idx_lesson_progress_student on lesson_progress(student_id, lesson_id);

-- ============================================================
-- UPDATED_AT AUTOMÁTICO
-- ============================================================
do $$ begin
  create trigger set_updated_at before update on course_modules
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_updated_at before update on course_lessons
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_updated_at before update on lesson_progress
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table course_modules  enable row level security;
alter table course_lessons  enable row level security;
alter table lesson_questions enable row level security;
alter table lesson_progress enable row level security;

-- Leitura: qualquer usuário da escola vê módulos e lições publicadas
drop policy if exists "leitura escola" on course_modules;
create policy "leitura escola" on course_modules
  for select using (school_id = auth_school_id());

drop policy if exists "leitura escola" on course_lessons;
create policy "leitura escola" on course_lessons
  for select using (school_id = auth_school_id());

drop policy if exists "leitura escola" on lesson_questions;
create policy "leitura escola" on lesson_questions
  for select using (school_id = auth_school_id());

-- Escrita em módulos: só ADMIN
drop policy if exists "admin gerencia módulos" on course_modules;
create policy "admin gerencia módulos" on course_modules
  for all using (
    school_id = auth_school_id()
    and auth_role() = 'ADMIN'
  );

-- Escrita em lições: ADMIN ou o TEACHER dono da lição
drop policy if exists "admin ou teacher dono gerencia lições" on course_lessons;
create policy "admin ou teacher dono gerencia lições" on course_lessons
  for all using (
    school_id = auth_school_id()
    and (
      auth_role() = 'ADMIN'
      or (
        auth_role() = 'TEACHER'
        and teacher_id = (
          select id from teachers where profile_id = auth.uid() limit 1
        )
      )
    )
  );

-- Escrita em perguntas: ADMIN ou o TEACHER dono da lição pai
drop policy if exists "admin ou teacher dono gerencia perguntas" on lesson_questions;
create policy "admin ou teacher dono gerencia perguntas" on lesson_questions
  for all using (
    school_id = auth_school_id()
    and (
      auth_role() = 'ADMIN'
      or exists (
        select 1 from course_lessons cl
        where cl.id = lesson_questions.lesson_id
          and cl.teacher_id = (
            select id from teachers where profile_id = auth.uid() limit 1
          )
      )
    )
  );

-- Progresso: aluno gerencia o próprio, admin e teacher leem todos da escola
drop policy if exists "progresso próprio" on lesson_progress;
create policy "progresso próprio" on lesson_progress
  for all using (
    school_id = auth_school_id()
    and (
      auth_role() in ('ADMIN', 'TEACHER')
      or student_id = (
        select id from students where profile_id = auth.uid() limit 1
      )
    )
  );
