# Fase 0 — Fundação · design

Decisões de **setup** que `CLAUDE.md`, `DECISIONS.md` e `ISSUES.md` deixaram em
aberto. O produto já está especificado nesses três arquivos — este documento não
os repete e não os contradiz. Onde houver divergência, eles vencem.

Escopo: tarefas 0.1 a 0.5 do `ISSUES.md`.

---

## Versões

Next 16.2 (App Router) · React 19 · TypeScript strict · Tailwind 4 (CSS-first,
`@theme`) · shadcn/ui · next-intl 4.13 · `@supabase/ssr` 0.12 · Vitest 4 ·
Playwright. Gerenciador: **pnpm**, como o aceite da 0.1 exige.

## D-01 — i18n sem segmento de locale na URL

A árvore de pastas do `CLAUDE.md` não tem `[locale]`, e o perfil público é
`/u/{username}`. Portanto next-intl roda **sem i18n routing**: o locale sai de um
cookie (`NEXT_LOCALE`) e, para usuário logado, de `profiles.locale`. Trocar de
idioma não muda a URL.

Custo aceito: sem URL por idioma, o perfil público não indexa em duas línguas.
Se isso passar a importar, migra-se para `localePrefix: 'as-needed'` — o que
muda é o roteamento, não os arquivos de tradução.

Traduz-se **só a interface**. Título de curso, nome de cadeira e de livro são
dado do usuário e ficam como ele digitou.

## D-02 — Tema

`next-themes` (~2KB) com `class` no `<html>`, escuro default, sem flash na
primeira pintura. Não viola "não instale biblioteca de estado global": ele não
guarda estado de aplicação, só reflete uma preferência no DOM.

Tema claro é o mesmo sistema invertido (base vira a mais clara, texto vira a mais
escura), não uma paleta nova.

## D-03 — Tokens no Tailwind 4

As cores do `CLAUDE.md` viram variáveis em `@theme` dentro de `globals.css`:

| Token | Escuro | Papel |
|---|---|---|
| `--color-base` | `#0F1117` | fundo da página |
| `--color-surface` | `#171A21` | card, painel |
| `--color-border` | `#242833` | borda, divisória |
| `--color-fg` | `#E6E8EC` | texto |
| `--color-fg-muted` | `#9AA0AC` | texto secundário |
| `--color-progress` | `#E0A458` | streak, XP, leitura |
| `--color-academic` | `#7BA7C7` | liberada, cursando |
| `--color-danger` | `#C4695E` | erro, conflito |

Raio uniforme 6px (`--radius: 0.375rem`). Uma sombra só. Sem gradiente.

## D-04 — Tipografia

Três papéis, via `next/font/google`, expostos como `--font-display`,
`--font-body`, `--font-mono`:

- Display — Bricolage Grotesque, tracking apertado. **Só título de seção.**
- Corpo — Inter.
- Dados — **JetBrains Mono** com `font-variant-numeric: tabular-nums`. Os docs
  pedem mono mas não nomeiam a fonte; JetBrains Mono tem numeral tabular real e
  distingue `0`/`O` e `1`/`l`, o que importa em credential ID e código de cadeira.

Uma classe utilitária `.tabular` aplica mono + tabular-nums. Mono nunca em prosa.

## D-05 — Supabase local primeiro

Supabase CLI + Docker (colima já roda). O stack local dá Postgres, Auth e Storage
sem depender de nada externo e sem gastar o free tier antes da hora. O projeto
cloud entra quando formos para a Vercel.

`schema.sql` entra intacto como `supabase/migrations/20260724000000_init.sql`.
A partir do primeiro `db reset` bem-sucedido, essa migration é imutável (ADR-02
do produto: migration aplicada não se edita, cria-se outra).

Tipos gerados por `supabase gen types typescript --local` em
`src/lib/supabase/database.types.ts`. Regenerar faz parte de toda tarefa que
mexer no schema.

## D-06 — Três clients Supabase, papéis separados

- `lib/supabase/server.ts` — Server Component e Server Action, sessão via cookie.
- `lib/supabase/browser.ts` — `"use client"`, chave anon.
- `lib/supabase/admin.ts` — service role. **Só em código de servidor**, e só no
  resgate de convite, que precisa escrever fora da RLS (ADR-04). O arquivo
  começa com uma guarda que joga se for importado no bundle do client.

## D-07 — Convite e sessão

Sem convite válido, sem conta. O fluxo:

1. `/login` → OAuth do GitHub → callback grava sessão.
2. Se o usuário autenticado **não tem `profile`**, o middleware manda para
   `/aceitar-convite`, e é o único lugar que ele consegue abrir.
3. O resgate roda no servidor com service role, numa transação: valida o código
   (existe, não expirado, não usado), valida o username contra o mesmo regex do
   schema (`^[a-z0-9_-]{3,30}$`), cria o `profile` e marca `used_by`/`used_at`.
4. Código inválido, expirado ou já usado retorna `{ error }` tipado — três
   mensagens distintas, porque o usuário precisa saber o que fazer.
5. Username duplicado: capturado pela violação de unicidade e devolvido no campo
   do formulário, não como erro de página.

Middleware protege todo o grupo `(app)/`. `/u/{username}` fica fora.

## D-08 — Suíte de RLS orientada por catálogo

O aceite da 0.4 pede que a suíte falhe quando alguém adicionar tabela sem policy.
Lista escrita à mão não faz isso — ela envelhece em silêncio. Então o teste
consulta `pg_class` e `pg_policies` e **gera os casos a partir do que existe no
banco**:

- toda tabela de `public` tem `rowsecurity = true` e pelo menos uma policy;
- para cada tabela com coluna `user_id` (ou `id` referenciando `auth.users`),
  com dois usuários reais criados via admin API: B faz `select` na linha de A e
  recebe zero linha; B faz `update` e `delete` na linha de A e não afeta nada;
  B faz `insert` com `user_id` de A e é recusado.

Roda contra o Supabase local. É a suíte que se roda a cada fase, não só na 0.4.

## D-09 — Casca do app

Mobile (390px) é o alvo primário: bottom nav de 4 abas + FAB de adicionar,
alvo de toque mínimo de 44px, nav fixa respeitando `safe-area-inset-bottom`.
Desktop: a mesma navegação vira sidebar, mais command palette `⌘K` (`cmdk`, que
vem com o shadcn) que navega **e** cria.

Quatro abas: Dashboard · Acadêmico · Missões · Biblioteca (certificados, cursos,
livros). Config e perfil saem do avatar, não gastam aba.

Estados vazio, carregando e erro viram três componentes padronizados usados em
toda tela, para não serem reinventados por página. Tela vazia é convite para
agir. Erro diz o que quebrou e como resolver.

## Testes

- Vitest para `src/domain/` (puro) e para as funções de validação do convite.
- Vitest + Supabase local para a suíte de RLS.
- Playwright para login e upload, conforme o `CLAUDE.md` — na Fase 0 entra só o
  esqueleto e o teste de "sem sessão em `/dashboard` cai no login".

## Dependência externa

A 0.3 não fecha sozinha: precisa de um **GitHub OAuth App** com
`http://127.0.0.1:54321/auth/v1/callback` como callback, e do Client ID/Secret
em `supabase/config.toml` via variável de ambiente. Isso é ação do Gabriel.
Tudo que não depende disso — resgate de convite, middleware, validação, testes —
é feito e testado antes.

## Fora desta fase

Qualquer coisa das fases 1 a 4. "Já que estou aqui" é proibido pelo `CLAUDE.md`.
