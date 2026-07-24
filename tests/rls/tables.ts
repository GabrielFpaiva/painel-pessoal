import type { SeededIds } from "./fixture";

/**
 * Registro das tabelas de `public` e de como um estranho tentaria mexer nelas.
 *
 * A lista é conferida contra o catálogo do Postgres no teste: tabela nova sem
 * entrada aqui quebra a suíte. É o que impede este arquivo de envelhecer em
 * silêncio enquanto o schema cresce.
 */
export type TableSpec = {
  table: string;
  /** Identifica a linha do usuário A. */
  match: (a: SeededIds) => Record<string, string | number>;
  /** Alteração inócua. Ausente quando a tabela só tem colunas de chave. */
  patch?: Record<string, string | number>;
  /** Linha que B tenta inserir no espaço de A. */
  forge: (a: SeededIds) => Record<string, unknown>;
};

export const tableSpecs: TableSpec[] = [
  {
    table: "profiles",
    match: (a) => ({ id: a.userId }),
    patch: { display_name: "invadido" },
    forge: (a) => ({ id: a.userId, username: "forjado" }),
  },
  {
    table: "invites",
    match: (a) => ({ code: a.inviteCode }),
    patch: { expires_at: "2030-01-01T00:00:00Z" },
    forge: (a) => ({ created_by: a.userId }),
  },
  {
    table: "certificates",
    match: (a) => ({ id: a.certificateId }),
    patch: { title: "invadido" },
    forge: (a) => ({ user_id: a.userId, title: "forjado" }),
  },
  {
    table: "tags",
    match: (a) => ({ id: a.tagId }),
    patch: { name: "invadida" },
    forge: (a) => ({ user_id: a.userId, name: "forjada" }),
  },
  {
    table: "certificate_tags",
    match: (a) => ({ certificate_id: a.certificateId, tag_id: a.tagId }),
    forge: (a) => ({ certificate_id: a.certificateId, tag_id: a.tagId }),
  },
  {
    table: "courses",
    match: (a) => ({ id: a.courseId }),
    patch: { title: "invadido" },
    forge: (a) => ({ user_id: a.userId, title: "forjado" }),
  },
  {
    table: "roadmaps",
    match: (a) => ({ id: a.roadmapId }),
    patch: { title: "invadido" },
    forge: (a) => ({ user_id: a.userId, title: "forjado" }),
  },
  {
    table: "roadmap_steps",
    match: (a) => ({ id: a.roadmapStepId }),
    patch: { title: "invadida" },
    forge: (a) => ({ roadmap_id: a.roadmapId, position: 99, title: "forjada" }),
  },
  {
    table: "missions",
    match: (a) => ({ id: a.missionId }),
    patch: { title: "invadida" },
    forge: (a) => ({
      user_id: a.userId,
      title: "forjada",
      kind: "once",
      due_on: "2026-12-01",
    }),
  },
  {
    table: "mission_logs",
    match: (a) => ({ id: a.missionLogId }),
    patch: { status: "skipped" },
    forge: (a) => ({
      user_id: a.userId,
      mission_id: a.missionId,
      due_on: "2026-12-01",
      status: "done",
    }),
  },
  {
    table: "user_stats",
    match: (a) => ({ user_id: a.userId }),
    patch: { xp: 99999 },
    forge: (a) => ({ user_id: a.userId, xp: 1 }),
  },
  {
    table: "books",
    match: (a) => ({ id: a.bookId }),
    patch: { title: "invadido" },
    forge: (a) => ({ user_id: a.userId, title: "forjado" }),
  },
  {
    table: "reading_progress",
    match: (a) => ({ id: a.readingProgressId }),
    patch: { page: 1 },
    forge: (a) => ({
      user_id: a.userId,
      book_id: a.bookId,
      read_on: "2026-12-01",
      page: 10,
    }),
  },
  {
    table: "book_notes",
    match: (a) => ({ id: a.bookNoteId }),
    patch: { content: "invadida" },
    forge: (a) => ({
      user_id: a.userId,
      book_id: a.bookId,
      content: "forjada",
    }),
  },
  {
    table: "reading_goals",
    match: (a) => ({ user_id: a.userId, year: a.readingGoalYear }),
    patch: { target_books: 1 },
    forge: (a) => ({ user_id: a.userId, year: 2030, target_books: 5 }),
  },
  {
    table: "github_connections",
    match: (a) => ({ user_id: a.userId }),
    patch: { github_login: "invadido" },
    forge: (a) => ({
      user_id: a.userId,
      github_login: "forjado",
      encrypted_token: "forjado",
    }),
  },
  {
    table: "github_repos",
    match: (a) => ({ id: a.repoId }),
    patch: { name: "invadido" },
    forge: (a) => ({
      user_id: a.userId,
      repo_id: 987654321,
      name: "forjado",
      full_name: "forjado/forjado",
      html_url: "https://github.com/forjado/forjado",
    }),
  },
  {
    table: "curricula",
    match: (a) => ({ id: a.curriculumId }),
    patch: { institution: "invadida" },
    forge: (a) => ({
      user_id: a.userId,
      institution: "forjada",
      program: "forjado",
    }),
  },
  {
    table: "subjects",
    match: (a) => ({ id: a.subjectId }),
    patch: { name: "invadida" },
    forge: (a) => ({
      curriculum_id: a.curriculumId,
      code: "FORJADA1",
      name: "forjada",
    }),
  },
  {
    table: "subject_relations",
    match: (a) => ({
      subject_id: a.relatedSubjectId,
      related_id: a.subjectId,
      kind: "prerequisite",
    }),
    forge: (a) => ({
      subject_id: a.subjectId,
      related_id: a.relatedSubjectId,
      kind: "corequisite",
    }),
  },
  {
    table: "enrollments",
    match: (a) => ({ id: a.enrollmentId }),
    patch: { grade: 10 },
    forge: (a) => ({
      user_id: a.userId,
      subject_id: a.subjectId,
      term: "2030.1",
    }),
  },
  {
    table: "schedule_slots",
    match: (a) => ({ id: a.scheduleSlotId }),
    patch: { weekday: 3 },
    forge: (a) => ({
      user_id: a.userId,
      enrollment_id: a.enrollmentId,
      weekday: 2,
      starts_at: "10:00",
      ends_at: "12:00",
    }),
  },
];
