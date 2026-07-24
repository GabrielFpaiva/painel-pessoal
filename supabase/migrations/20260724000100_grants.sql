-- =============================================================================
-- Privilégios de tabela para os roles do PostgREST
-- =============================================================================
-- A migration inicial liga RLS e escreve as policies, mas não concede nenhum
-- privilégio a `anon` e `authenticated`. As duas coisas são independentes:
-- GRANT diz se o role pode tentar, a policy diz quais linhas ele alcança. Sem
-- GRANT, toda query morre em "permission denied", inclusive a do dono.
--
-- Descoberto pela suíte de isolamento (tests/rls): o usuário A não conseguia
-- ler o próprio certificado.

grant usage on schema public to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- service_role: acesso total. Tem BYPASSRLS, mas isso não substitui GRANT — sem
-- privilégio de tabela ele enxerga zero linha, e o resgate de convite (que roda
-- com esta chave) recusaria todo código como inexistente.
-- -----------------------------------------------------------------------------

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

-- -----------------------------------------------------------------------------
-- authenticated: pode tentar tudo; quem limita à própria linha é a RLS.
-- -----------------------------------------------------------------------------

grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

-- Tabela criada em migration futura já nasce acessível — para ninguém repetir
-- este mesmo bug na Fase 1.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- -----------------------------------------------------------------------------
-- anon: SELECT apenas onde existe policy de leitura pública.
-- -----------------------------------------------------------------------------
-- A RLS já barraria o resto, mas conceder só o necessário mantém as duas
-- camadas de acordo: vida acadêmica, missões, streak e notas de leitura são
-- privadas por definição (ADR-09) e o role anônimo não tem nem por onde tentar.

grant select on public.profiles         to anon;
grant select on public.certificates     to anon;
grant select on public.tags             to anon;
grant select on public.certificate_tags to anon;
grant select on public.courses          to anon;
grant select on public.books            to anon;
grant select on public.github_repos     to anon;

-- -----------------------------------------------------------------------------
-- Funções
-- -----------------------------------------------------------------------------
-- `is_profile_public` é chamada de dentro das policies de leitura pública, logo
-- precisa ser executável pelo role que faz a query — inclusive o anônimo.

grant execute on function public.is_profile_public(uuid) to anon, authenticated, service_role;
grant execute on function public.available_subjects(uuid) to authenticated, service_role;
grant execute on function public.academic_summary(uuid)  to authenticated, service_role;
