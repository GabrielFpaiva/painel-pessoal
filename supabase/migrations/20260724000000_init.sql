-- =============================================================================
-- Painel pessoal — schema inicial (Supabase / Postgres)
-- Multiusuário, RLS obrigatória em toda tabela.
-- Padrão de policy:
--   owner_all   -> dono faz tudo
--   public_read -> leitura anônima quando o item é público E o perfil é público
-- =============================================================================

create extension if not exists citext;
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Usada nas policies de leitura pública. SECURITY DEFINER para não cair em
-- recursão de RLS ao consultar profiles de dentro de uma policy.
create or replace function public.is_profile_public(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_public from public.profiles where id = p_user_id), false)
$$;

-- =============================================================================
-- Conta e perfil
-- =============================================================================

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     citext unique not null check (username ~ '^[a-z0-9_-]{3,30}$'),
  display_name text,
  bio          text,
  avatar_url   text,
  locale       text not null default 'pt-BR' check (locale in ('pt-BR','en')),
  timezone     text not null default 'America/Fortaleza',
  is_public    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger t_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

create policy owner_all on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy public_read on public.profiles
  for select using (is_public);

-- Cadastro só por convite: código de uso único, com validade.
create table public.invites (
  code       text primary key default encode(gen_random_bytes(6),'hex'),
  created_by uuid references auth.users(id) on delete set null,
  used_by    uuid references auth.users(id) on delete set null,
  used_at    timestamptz,
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

alter table public.invites enable row level security;

create policy owner_all on public.invites
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());
-- O resgate do convite roda no servidor com service role, fora da RLS.

-- =============================================================================
-- Certificados
-- =============================================================================

create table public.certificates (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  institution      text,
  issued_on        date,
  expires_on       date,
  workload_hours   integer check (workload_hours >= 0),
  credential_id    text,
  verification_url text,
  file_path        text,                       -- caminho no bucket, nunca URL
  file_mime        text check (file_mime in ('application/pdf','image/png','image/jpeg')),
  file_size_bytes  integer check (file_size_bytes <= 5 * 1024 * 1024),
  is_public        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (expires_on is null or issued_on is null or expires_on >= issued_on)
);

create index on public.certificates (user_id, issued_on desc);
create index on public.certificates (user_id, expires_on) where expires_on is not null;

create trigger t_certificates_updated before update on public.certificates
  for each row execute function public.touch_updated_at();

alter table public.certificates enable row level security;

create policy owner_all on public.certificates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy public_read on public.certificates
  for select using (is_public and public.is_profile_public(user_id));

-- Tags / skills
create table public.tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name    citext not null,
  unique (user_id, name)
);

create table public.certificate_tags (
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  tag_id         uuid not null references public.tags(id) on delete cascade,
  primary key (certificate_id, tag_id)
);

alter table public.tags enable row level security;
alter table public.certificate_tags enable row level security;

create policy owner_all on public.tags
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy public_read on public.tags
  for select using (public.is_profile_public(user_id));

create policy owner_all on public.certificate_tags
  for all using (exists (select 1 from public.certificates c
                         where c.id = certificate_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.certificates c
                      where c.id = certificate_id and c.user_id = auth.uid()));
create policy public_read on public.certificate_tags
  for select using (exists (select 1 from public.certificates c
                            where c.id = certificate_id
                              and c.is_public
                              and public.is_profile_public(c.user_id)));

-- =============================================================================
-- Cursos e roadmap
-- =============================================================================

create table public.courses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  platform       text,
  url            text,
  workload_hours integer check (workload_hours >= 0),
  progress_pct   smallint not null default 0 check (progress_pct between 0 and 100),
  status         text not null default 'queued'
                 check (status in ('queued','doing','paused','done')),
  started_on     date,
  finished_on    date,
  certificate_id uuid references public.certificates(id) on delete set null,
  is_public      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger t_courses_updated before update on public.courses
  for each row execute function public.touch_updated_at();

alter table public.courses enable row level security;
create policy owner_all on public.courses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy public_read on public.courses
  for select using (is_public and public.is_profile_public(user_id));

-- Roadmap é LINEAR (lista ordenada). O grafo existe só no módulo acadêmico.
create table public.roadmaps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  goal        text,
  target_date date,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.roadmap_steps (
  id          uuid primary key default gen_random_uuid(),
  roadmap_id  uuid not null references public.roadmaps(id) on delete cascade,
  position    integer not null,
  title       text not null,
  description text,
  status      text not null default 'todo' check (status in ('todo','doing','done')),
  course_id   uuid references public.courses(id) on delete set null,
  done_at     timestamptz,
  unique (roadmap_id, position) deferrable initially deferred
);

alter table public.roadmaps enable row level security;
alter table public.roadmap_steps enable row level security;

create policy owner_all on public.roadmaps
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy owner_all on public.roadmap_steps
  for all using (exists (select 1 from public.roadmaps r
                         where r.id = roadmap_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.roadmaps r
                      where r.id = roadmap_id and r.user_id = auth.uid()));

-- =============================================================================
-- Missões, streak e XP
-- =============================================================================

create table public.missions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  notes             text,
  kind              text not null default 'once' check (kind in ('once','recurring')),
  weekdays          smallint[] not null default '{}',  -- 0=dom .. 6=sáb, só p/ recurring
  due_on            date,                              -- só p/ once
  xp_reward         smallint not null default 10 check (xp_reward between 1 and 100),
  source            text not null default 'manual'
                    check (source in ('manual','roadmap','course','subject')),
  roadmap_step_id   uuid references public.roadmap_steps(id) on delete cascade,
  course_id         uuid references public.courses(id) on delete cascade,
  enrollment_id     uuid,  -- FK adicionada após a criação de enrollments
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  check (kind <> 'recurring' or array_length(weekdays,1) > 0),
  check (kind <> 'once' or due_on is not null)
);

create index on public.missions (user_id) where is_active;

-- Uma linha por missão por dia. Ausência de linha = ainda não resolvida.
create table public.mission_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  mission_id   uuid not null references public.missions(id) on delete cascade,
  due_on       date not null,
  status       text not null check (status in ('done','missed','skipped')),
  completed_at timestamptz,
  unique (mission_id, due_on)
);

create index on public.mission_logs (user_id, due_on desc);

-- Contadores derivados, mantidos pela aplicação ao fechar o dia.
create table public.user_stats (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  xp              integer not null default 0 check (xp >= 0),
  current_streak  integer not null default 0 check (current_streak >= 0),
  longest_streak  integer not null default 0 check (longest_streak >= 0),
  last_closed_on  date,          -- último dia já apurado, no fuso do usuário
  shields         smallint not null default 1 check (shields between 0 and 1),
  shield_week     date,          -- segunda-feira da semana do escudo atual
  updated_at      timestamptz not null default now()
);

alter table public.missions enable row level security;
alter table public.mission_logs enable row level security;
alter table public.user_stats enable row level security;

create policy owner_all on public.missions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy owner_all on public.mission_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy owner_all on public.user_stats
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Missões e streak nunca vão para o perfil público: sem policy de leitura pública.

-- =============================================================================
-- Livros
-- =============================================================================

create table public.books (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  author       text,
  isbn13       text check (isbn13 ~ '^[0-9]{13}$'),
  cover_url    text,
  total_pages  integer check (total_pages > 0),
  current_page integer not null default 0 check (current_page >= 0),
  status       text not null default 'reading'
               check (status in ('want','reading','read','abandoned')),
  rating       smallint check (rating between 1 and 5),
  started_on   date,
  finished_on  date,
  is_public    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (total_pages is null or current_page <= total_pages)
);

create index on public.books (user_id, status);

create trigger t_books_updated before update on public.books
  for each row execute function public.touch_updated_at();

-- Marco de progresso: alimenta o cálculo de ritmo e a previsão de término.
create table public.reading_progress (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  read_on date not null,
  page    integer not null check (page >= 0),
  unique (book_id, read_on)
);

-- Notas e destaques sempre privados, mesmo em livro público.
create table public.book_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  book_id    uuid not null references public.books(id) on delete cascade,
  page       integer,
  content    text not null,           -- markdown
  created_at timestamptz not null default now()
);

create table public.reading_goals (
  user_id      uuid not null references auth.users(id) on delete cascade,
  year         smallint not null,
  target_books smallint not null check (target_books > 0),
  primary key (user_id, year)
);

alter table public.books enable row level security;
alter table public.reading_progress enable row level security;
alter table public.book_notes enable row level security;
alter table public.reading_goals enable row level security;

create policy owner_all on public.books
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy public_read on public.books
  for select using (is_public and status = 'read' and public.is_profile_public(user_id));

create policy owner_all on public.reading_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy owner_all on public.book_notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy owner_all on public.reading_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================================
-- GitHub
-- =============================================================================

create table public.github_connections (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  github_login    text not null,
  encrypted_token text not null,       -- Supabase Vault; nunca sai do servidor
  synced_at       timestamptz
);

create table public.github_repos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  repo_id      bigint not null,
  name         text not null,
  full_name    text not null,
  description  text,
  html_url     text not null,
  language     text,
  stars        integer not null default 0,
  open_issues  integer not null default 0,
  open_prs     integer not null default 0,
  is_private   boolean not null default false,
  pushed_at    timestamptz,
  is_public    boolean not null default false,   -- toggle "mostrar no perfil"
  synced_at    timestamptz not null default now(),
  unique (user_id, repo_id)
);

alter table public.github_connections enable row level security;
alter table public.github_repos enable row level security;

create policy owner_all on public.github_connections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy owner_all on public.github_repos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Repositório privado nunca aparece no perfil público, mesmo marcado.
create policy public_read on public.github_repos
  for select using (is_public and not is_private and public.is_profile_public(user_id));

-- =============================================================================
-- Módulo acadêmico
-- =============================================================================

-- Cada usuário tem a própria cópia da estrutura curricular. Sem catálogo global:
-- evita precisar de área administrativa e de curadoria compartilhada.
create table public.curricula (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  institution            text not null,
  program                text not null,
  required_credits       integer check (required_credits > 0),
  required_elective_credits integer,
  created_at             timestamptz not null default now()
);

create table public.subjects (
  id             uuid primary key default gen_random_uuid(),
  curriculum_id  uuid not null references public.curricula(id) on delete cascade,
  code           text not null,
  name           text not null,
  credits        smallint not null default 0 check (credits >= 0),
  hours          smallint check (hours >= 0),
  kind           text not null default 'required'
                 check (kind in ('required','elective','optional')),
  suggested_term smallint check (suggested_term between 1 and 20),
  unique (curriculum_id, code)
);

-- Grafo: pré-requisito, co-requisito e equivalência na mesma tabela.
create table public.subject_relations (
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  related_id  uuid not null references public.subjects(id) on delete cascade,
  kind        text not null check (kind in ('prerequisite','corequisite','equivalent')),
  primary key (subject_id, related_id, kind),
  check (subject_id <> related_id)
);

-- O que o usuário cursou / está cursando / planeja cursar.
create table public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  term       text not null,                    -- '2026.1'
  status     text not null default 'planned'
             check (status in ('planned','enrolled','passed','failed','withdrawn','waived')),
  grade      numeric(4,2) check (grade >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, subject_id, term)
);

create index on public.enrollments (user_id, status);

-- Horário: entrada manual de dia e faixa de hora.
create table public.schedule_slots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),
  starts_at     time not null,
  ends_at       time not null,
  check (ends_at > starts_at)
);

create index on public.schedule_slots (user_id, weekday);

alter table public.missions
  add constraint missions_enrollment_fk
  foreign key (enrollment_id) references public.enrollments(id) on delete cascade;

alter table public.curricula enable row level security;
alter table public.subjects enable row level security;
alter table public.subject_relations enable row level security;
alter table public.enrollments enable row level security;
alter table public.schedule_slots enable row level security;

create policy owner_all on public.curricula
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy owner_all on public.subjects
  for all using (exists (select 1 from public.curricula c
                         where c.id = curriculum_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.curricula c
                      where c.id = curriculum_id and c.user_id = auth.uid()));

create policy owner_all on public.subject_relations
  for all using (exists (select 1 from public.subjects s join public.curricula c
                           on c.id = s.curriculum_id
                         where s.id = subject_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.subjects s join public.curricula c
                        on c.id = s.curriculum_id
                      where s.id = subject_id and c.user_id = auth.uid()));

create policy owner_all on public.enrollments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy owner_all on public.schedule_slots
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Vida acadêmica é privada por definição: nenhuma policy de leitura pública aqui.

-- -----------------------------------------------------------------------------
-- Consultas do módulo acadêmico
-- -----------------------------------------------------------------------------

-- Cadeiras liberadas: todos os pré-requisitos concluídos e ainda não concluída.
-- 'waived' (dispensada) conta como concluída.
create or replace function public.available_subjects(p_curriculum_id uuid)
returns table (subject_id uuid, code text, name text, credits smallint, unlocks integer)
language sql stable security invoker set search_path = public as $$
  with done as (
    select e.subject_id
    from enrollments e
    where e.user_id = auth.uid() and e.status in ('passed','waived')
  )
  select s.id,
         s.code,
         s.name,
         s.credits,
         -- quantas cadeiras esta destrava diretamente
         (select count(*)::integer
            from subject_relations r
           where r.related_id = s.id and r.kind = 'prerequisite')
  from subjects s
  where s.curriculum_id = p_curriculum_id
    and s.id not in (select subject_id from done)
    and not exists (
      select 1
      from subject_relations r
      where r.subject_id = s.id
        and r.kind = 'prerequisite'
        and r.related_id not in (select subject_id from done)
    )
  order by s.suggested_term nulls last, s.code;
$$;

-- Integralização e coeficiente de rendimento.
create or replace function public.academic_summary(p_curriculum_id uuid)
returns table (
  earned_credits   integer,
  required_credits integer,
  progress_pct     numeric,
  gpa              numeric
)
language sql stable security invoker set search_path = public as $$
  with done as (
    select s.credits, e.grade, e.status
    from enrollments e
    join subjects s on s.id = e.subject_id
    where e.user_id = auth.uid()
      and s.curriculum_id = p_curriculum_id
      and e.status in ('passed','waived')
  )
  select
    coalesce(sum(d.credits),0)::integer,
    (select c.required_credits from curricula c where c.id = p_curriculum_id),
    round(100.0 * coalesce(sum(d.credits),0)
          / nullif((select c.required_credits from curricula c where c.id = p_curriculum_id),0), 1),
    -- média ponderada por crédito, ignorando dispensadas (sem nota)
    round(sum(d.grade * d.credits) filter (where d.grade is not null)
          / nullif(sum(d.credits) filter (where d.grade is not null),0), 2)
  from done d;
$$;

-- =============================================================================
-- Storage
-- =============================================================================
-- Bucket privado. Caminho obrigatório: {user_id}/{certificate_id}.{ext}
-- Leitura só por signed URL gerada no servidor para o dono.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificates', 'certificates', false, 5242880,
        array['application/pdf','image/png','image/jpeg'])
on conflict (id) do nothing;

create policy "cert_owner_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'certificates'
         and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'certificates'
              and (storage.foldername(name))[1] = auth.uid()::text);
