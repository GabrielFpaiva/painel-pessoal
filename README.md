# Painel

Painel pessoal de progresso: certificados, cursos e roadmap, missões diárias,
livros, repositórios do GitHub e módulo acadêmico.

O manual do repositório é o [`CLAUDE.md`](./CLAUDE.md) — leia antes de escrever
código. As decisões estão em [`DECISIONS.md`](./DECISIONS.md) e o backlog em
[`ISSUES.md`](./ISSUES.md).

## Rodar

Precisa de Node 20+, pnpm e Docker (colima serve).

```bash
pnpm install
supabase start                 # sobe Postgres, Auth e Storage locais
cp .env.local.example .env.local
supabase status -o json        # copie ANON_KEY e SERVICE_ROLE_KEY para o .env.local
pnpm dev
```

O app fica em http://localhost:3000 e o Studio do Supabase em
http://127.0.0.1:54323.

### Login pelo GitHub

O produto só entra por GitHub OAuth. Para funcionar no local:

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Homepage `http://localhost:3000`, callback
   `http://127.0.0.1:54321/auth/v1/callback`
3. Ponha `SUPABASE_AUTH_GITHUB_CLIENT_ID` e `SUPABASE_AUTH_GITHUB_SECRET` no
   `.env.local`
4. `supabase stop && supabase start`

### Convite

Sem convite não existe conta. Para gerar um:

```sql
insert into public.invites default values returning code;
```

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Domínio puro (Vitest) |
| `pnpm test:rls` | Isolamento por RLS, dois usuários reais (precisa do Supabase no ar) |
| `pnpm test:e2e` | Playwright, mobile 390px e desktop |
| `pnpm validate` | Tudo acima, em ordem |
| `pnpm db:reset` | Recria o banco aplicando as migrations |
| `pnpm db:types` | Regenera `src/lib/supabase/database.types.ts` |

Mexeu no schema? `pnpm db:reset && pnpm db:types && pnpm test:rls`.

## Estado

Fase 0 (Fundação) concluída. As fases seguintes estão no `ISSUES.md`, em ordem.
Fase é fase: não implemente a próxima "já que estou aqui".
