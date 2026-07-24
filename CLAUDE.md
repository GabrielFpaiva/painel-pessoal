# CLAUDE.md

Manual de operação deste repositório. Leia inteiro antes de escrever código.

## O que é

Painel pessoal de progresso. Um lugar só para: certificados, cursos e roadmap,
missões diárias, livros, repositórios do GitHub e o **módulo acadêmico** (grade
curricular, o que já cursei, o que posso pegar, montagem de horário).

Multiusuário: qualquer pessoa com convite cria a própria conta e o próprio espaço.
Cada usuário tem um perfil público opcional em `/u/{username}`.

## Restrições rígidas (não negocie sem perguntar)

1. **Custo zero.** Só free tier: Supabase (DB + Auth + Storage) e Vercel Hobby.
   Nada de serviço pago, nada de fila gerenciada, nada de chamada de LLM em
   runtime. A única exceção autorizada é o parser do histórico acadêmico
   (importação única, opt-in, com chave do próprio usuário).
2. **Sem cron / sem job em background.** Não existe scheduler neste projeto.
   Tudo que pareceria job agendado é calculado sob demanda quando a página
   carrega (alerta de vencimento, missões do dia, streak, cache do GitHub).
3. **RLS desde a primeira migration.** Nenhuma tabela sem Row Level Security.
   Nenhuma query no client confiando em filtro de aplicação.
4. **Mobile-first.** Projete a tela no viewport de 390px primeiro, depois expanda.
   Se a feature só funciona bem no desktop, ela está errada.
5. **Bilíngue pt-BR / en.** Zero string solta no JSX. `next-intl`, pt-BR default.
   Traduza **só a interface** — título de curso, nome de cadeira e livro são
   dados do usuário e ficam como ele digitou.

## Stack

- Next.js (App Router) + TypeScript strict
- Tailwind + shadcn/ui
- Supabase: Postgres, Auth (GitHub OAuth), Storage
- `next-intl` para i18n
- `pdf.js` para ler a camada de texto de PDFs (client-side)
- Deploy na Vercel
- Vitest (lógica de domínio) + Playwright (login e upload)

Server Components por padrão. `"use client"` só onde há estado ou evento.
Mutação sempre por Server Action, nunca `fetch` para rota interna.

## Estrutura

```
src/
  app/
    (auth)/            login, aceitar convite
    (app)/             área privada — tudo aqui exige sessão
      dashboard/
      certificados/
      cursos/
      roadmap/
      missoes/
      livros/
      academico/
      github/
      config/
    u/[username]/      perfil público (sem sessão)
  components/ui/       shadcn, não editar à mão sem motivo
  components/          componentes do domínio
  domain/              LÓGICA PURA, sem I/O, sem Supabase — é aqui que mora o teste
    academic/          grafo de pré-requisitos, conflito de horário, integralização, CR
    missions/          streak, escudo, XP, geração da fila do dia
    books/             ritmo de leitura, previsão de término
    certificates/      janela de vencimento
  lib/supabase/        clients (server, browser, admin)
  i18n/
supabase/
  migrations/
```

Regra: se a função precisa de `await`, ela não pertence a `src/domain/`.

## Convenções

- Código, tabelas, colunas e identificadores em **inglês**. Texto de interface em
  arquivo de tradução. Documentação e comentários em **português**.
- Sem `any`. Sem `as` para calar o compilador. Tipos do banco gerados por
  `supabase gen types typescript`.
- Datas: coluna `date` para dia civil (emissão, vencimento, due da missão),
  `timestamptz` para instante. Nunca `timestamp` sem timezone.
- Fuso do usuário vem de `profiles.timezone` (default `America/Fortaleza`).
  "Hoje" é sempre calculado no fuso do usuário, nunca em UTC nem no fuso do servidor.
- Dinheiro e nota: `numeric`, jamais `float`.
- Erro em Server Action retorna objeto `{ error }` tipado; não jogue exceção crua na UI.

## Segurança

- Bucket `certificates` é **privado**. Acesso só por signed URL de curta duração,
  gerada no servidor, e só para o dono.
- Certificado no perfil público mostra **card + link de verificação**. O arquivo
  nunca é exposto: PDF de certificado costuma trazer nome completo e às vezes CPF.
- Histórico acadêmico, notas, missões e roadmap são **sempre privados**. Não
  existe toggle público para eles.
- Token do GitHub fica criptografado (Supabase Vault) e nunca chega ao client.
- Convite: código de uso único, com expiração. Sem convite válido, sem conta.

## Direção visual

Minimalista, denso, orientado a teclado no desktop e a polegar no mobile.
Referência de comportamento: Linear.

O assunto do produto é **grade e progresso** — grade curricular, grade de horário,
grade de contribuição do GitHub, prateleira de livros. A grade é o motivo condutor,
não decoração.

Tokens:

- Base escura `#0F1117`, superfície `#171A21`, borda `#242833`
- Texto `#E6E8EC`, texto secundário `#9AA0AC`
- Acento de progresso (streak, XP, leitura): âmbar `#E0A458`
- Acento acadêmico (liberada, cursando, conflito): azul-gelo `#7BA7C7`
- Erro/conflito `#C4695E`
- Tema claro é o mesmo sistema invertido, não uma paleta nova

Tipografia em três papéis:
- Display (títulos de seção, só isso): Bricolage Grotesque, tracking apertado
- Corpo: Inter
- **Dados: mono com `font-variant-numeric: tabular-nums`** — código de cadeira,
  credential ID, nota, crédito, streak, página de livro, contador. Esta é a
  assinatura do produto: todo número alinha em coluna. Não use mono em prosa.

Raio de borda 6px, uniforme. Uma sombra só. Sem gradiente. Sem ícone decorativo:
ícone só quando substitui um rótulo que não caberia.

Animação: só transição de estado (missão concluída, cadeira destravada). Nada de
entrada em cascata, nada de parallax.

Copy: voz ativa, sentence case, o botão diz o que acontece. "Marcar como lida",
não "Enviar". Tela vazia é convite para agir, não recado triste. Erro diz o que
quebrou e como resolver.

## Definition of done

Uma tarefa só está pronta quando:

- [ ] RLS testada com dois usuários — B não enxerga nada de A
- [ ] Funciona a 390px de largura
- [ ] Strings em pt-BR **e** en
- [ ] Estado vazio, estado de carregamento e estado de erro desenhados
- [ ] Lógica nova em `src/domain/` tem teste no Vitest
- [ ] `tsc --noEmit` e `eslint` limpos
- [ ] Nenhuma chave nem token no bundle do client

## O que NÃO fazer

- Não instale biblioteca de estado global. Server Component + `useState` resolve.
- Não crie ORM por cima do Supabase. Use o client dele.
- Não adicione cron, worker, webhook ou serviço externo.
- Não chame LLM em runtime.
- Não mexa em `supabase/migrations/` já aplicada: crie uma nova.
- Não implemente fase futura "já que estou aqui". Fase é fase.
