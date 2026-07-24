import type { Client } from "pg";

/**
 * Uma linha por tabela, para um usuário. Semeado por conexão direta
 * (superusuário), porque o que está sob teste é a leitura e a escrita do
 * **outro** usuário, não a do dono.
 *
 * Tudo nasce privado: `is_public = false` onde a coluna existe. Leitura pública
 * é feature das fases 1 e 4 e tem teste próprio lá — aqui o assunto é
 * isolamento.
 */
export type SeededIds = {
  userId: string;
  username: string;
  inviteCode: string;
  certificateId: string;
  tagId: string;
  courseId: string;
  roadmapId: string;
  roadmapStepId: string;
  missionId: string;
  missionLogId: string;
  bookId: string;
  readingProgressId: string;
  bookNoteId: string;
  readingGoalYear: number;
  repoId: string;
  githubRepoNumericId: number;
  curriculumId: string;
  subjectId: string;
  relatedSubjectId: string;
  enrollmentId: string;
  scheduleSlotId: string;
};

async function insertReturningId(
  db: Client,
  sql: string,
  values: unknown[],
): Promise<string> {
  const result = await db.query<{ id: string }>(sql, values);
  const row = result.rows[0];
  if (!row) throw new Error(`Insert não devolveu id: ${sql}`);
  return row.id;
}

export async function seedUser(
  db: Client,
  userId: string,
  slug: string,
): Promise<SeededIds> {
  const username = `rls-${slug}`.toLowerCase().slice(0, 30);

  await db.query(
    `insert into public.profiles (id, username, display_name, is_public)
     values ($1, $2, 'Usuário de teste', false)`,
    [userId, username],
  );

  const inviteCode = await insertReturningId(
    db,
    `insert into public.invites (created_by) values ($1) returning code as id`,
    [userId],
  );

  const certificateId = await insertReturningId(
    db,
    `insert into public.certificates (user_id, title, institution, is_public)
     values ($1, 'Certificado privado', 'Instituição', false) returning id`,
    [userId],
  );

  const tagId = await insertReturningId(
    db,
    `insert into public.tags (user_id, name) values ($1, 'privada') returning id`,
    [userId],
  );

  await db.query(
    `insert into public.certificate_tags (certificate_id, tag_id) values ($1, $2)`,
    [certificateId, tagId],
  );

  const courseId = await insertReturningId(
    db,
    `insert into public.courses (user_id, title, is_public)
     values ($1, 'Curso privado', false) returning id`,
    [userId],
  );

  const roadmapId = await insertReturningId(
    db,
    `insert into public.roadmaps (user_id, title) values ($1, 'Roadmap') returning id`,
    [userId],
  );

  const roadmapStepId = await insertReturningId(
    db,
    `insert into public.roadmap_steps (roadmap_id, position, title)
     values ($1, 1, 'Primeira etapa') returning id`,
    [roadmapId],
  );

  const missionId = await insertReturningId(
    db,
    `insert into public.missions (user_id, title, kind, due_on)
     values ($1, 'Missão', 'once', current_date) returning id`,
    [userId],
  );

  const missionLogId = await insertReturningId(
    db,
    `insert into public.mission_logs (user_id, mission_id, due_on, status)
     values ($1, $2, current_date, 'done') returning id`,
    [userId, missionId],
  );

  await db.query(`insert into public.user_stats (user_id) values ($1)`, [
    userId,
  ]);

  const bookId = await insertReturningId(
    db,
    `insert into public.books (user_id, title, total_pages, is_public)
     values ($1, 'Livro', 300, false) returning id`,
    [userId],
  );

  const readingProgressId = await insertReturningId(
    db,
    `insert into public.reading_progress (user_id, book_id, read_on, page)
     values ($1, $2, current_date, 42) returning id`,
    [userId, bookId],
  );

  const bookNoteId = await insertReturningId(
    db,
    `insert into public.book_notes (user_id, book_id, content)
     values ($1, $2, 'Nota privada') returning id`,
    [userId, bookId],
  );

  const readingGoalYear = 2026;
  await db.query(
    `insert into public.reading_goals (user_id, year, target_books)
     values ($1, $2, 12)`,
    [userId, readingGoalYear],
  );

  await db.query(
    `insert into public.github_connections (user_id, github_login, encrypted_token)
     values ($1, $2, 'token-cifrado')`,
    [userId, username],
  );

  const githubRepoNumericId = Math.floor(Math.random() * 1_000_000_000);
  const repoId = await insertReturningId(
    db,
    `insert into public.github_repos
       (user_id, repo_id, name, full_name, html_url, is_private, is_public)
     values ($1, $2, 'repo', $3, 'https://github.com/x/repo', false, false)
     returning id`,
    [userId, githubRepoNumericId, `${username}/repo`],
  );

  const curriculumId = await insertReturningId(
    db,
    `insert into public.curricula (user_id, institution, program, required_credits)
     values ($1, 'UFPB', 'Ciência da Computação', 200) returning id`,
    [userId],
  );

  const subjectId = await insertReturningId(
    db,
    `insert into public.subjects (curriculum_id, code, name, credits, suggested_term)
     values ($1, 'GDSCO0001', 'Cálculo Vetorial', 4, 1) returning id`,
    [curriculumId],
  );

  const relatedSubjectId = await insertReturningId(
    db,
    `insert into public.subjects (curriculum_id, code, name, credits, suggested_term)
     values ($1, 'GDSCO0002', 'Cálculo II', 4, 2) returning id`,
    [curriculumId],
  );

  await db.query(
    `insert into public.subject_relations (subject_id, related_id, kind)
     values ($1, $2, 'prerequisite')`,
    [relatedSubjectId, subjectId],
  );

  const enrollmentId = await insertReturningId(
    db,
    `insert into public.enrollments (user_id, subject_id, term, status, grade)
     values ($1, $2, '2026.1', 'passed', 8.70) returning id`,
    [userId, subjectId],
  );

  const scheduleSlotId = await insertReturningId(
    db,
    `insert into public.schedule_slots (user_id, enrollment_id, weekday, starts_at, ends_at)
     values ($1, $2, 1, '08:00', '10:00') returning id`,
    [userId, enrollmentId],
  );

  return {
    userId,
    username,
    inviteCode,
    certificateId,
    tagId,
    courseId,
    roadmapId,
    roadmapStepId,
    missionId,
    missionLogId,
    bookId,
    readingProgressId,
    bookNoteId,
    readingGoalYear,
    repoId,
    githubRepoNumericId,
    curriculumId,
    subjectId,
    relatedSubjectId,
    enrollmentId,
    scheduleSlotId,
  };
}
