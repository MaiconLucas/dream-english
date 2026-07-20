odo i-- Fluxo editorial: administrador envia, professor revisa e aprova.
alter table course_lessons
  add column if not exists review_status text not null default 'PENDING_REVIEW'
    check (review_status in ('PENDING_REVIEW', 'CHANGES_REQUESTED', 'APPROVED')),
  add column if not exists review_note text,
  add column if not exists reviewed_by uuid references teachers(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create index if not exists idx_course_lessons_review
  on course_lessons(school_id, review_status);

-- Alterar o conteudo depois da aprovacao exige uma nova revisao.
create or replace function reset_course_lesson_review()
returns trigger language plpgsql as $$
begin
  if old.title is distinct from new.title
    or old.grammar_focus is distinct from new.grammar_focus
    or old.objectives is distinct from new.objectives
    or old.theory is distinct from new.theory
    or old.activity is distinct from new.activity
    or old.song_exercise is distinct from new.song_exercise
    or old.homework_text is distinct from new.homework_text then
    new.review_status := 'PENDING_REVIEW';
    new.review_note := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists reset_review_on_lesson_change on course_lessons;
create trigger reset_review_on_lesson_change
  before update on course_lessons
  for each row execute function reset_course_lesson_review();
