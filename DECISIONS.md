# Decisões de arquitetura

Registro curto do que foi decidido e, principalmente, **por quê** — para não
reabrir discussão encerrada e para saber o que muda se o contexto mudar.

---

## ADR-01 — Supabase + Vercel, custo zero

**Contexto.** Orçamento é literalmente R$0.
**Decisão.** Supabase (Postgres + Auth + Storage) e Vercel Hobby.
**Consequências.** 1GB de storage e 500MB de banco no free tier, compartilhados
entre todos os usuários. Projeto Supabase pausa após ~7 dias sem tráfego — o
primeiro acesso depois disso demora alguns segundos. Aceito.
**Reverter se.** O storage encostar no limite: aí ou entra plano pago, ou
migra os arquivos para Cloudflare R2.

---

## ADR-02 — Nenhum job agendado

**Contexto.** O plano Hobby limita cron de forma incompatível com lembretes em
múltiplos horários, e a feature de lembrete externo foi cortada do escopo.
**Decisão.** O projeto não tem scheduler. Tudo é calculado sob demanda no
carregamento da página: fila de missões do dia, apuração de streak desde
`last_closed_on`, alerta de certificado a vencer, validade do cache do GitHub.
**Consequências.** A apuração do streak precisa ser **idempotente e retroativa**:
se o usuário sumir cinco dias, o próximo acesso apura os cinco de uma vez. Essa é
a parte mais fácil de errar do sistema — tem teste dedicado.
**Reverter se.** Voltar a querer notificação push ou bot: aí entra GitHub Actions
como scheduler batendo numa rota protegida por secret. Continua grátis.

---

## ADR-03 — Sem LLM em runtime

**Contexto.** Custo zero e a extração de metadados de certificado foi cortada.
**Decisão.** Nenhuma chamada de modelo no fluxo normal. O pré-preenchimento do
certificado usa `pdf.js` lendo a camada de texto do PDF no próprio browser —
parsing local, não IA. PNG entra 100% manual.
**Exceção autorizada.** Importação do histórico acadêmico: acontece **uma vez na
vida**, fica atrás de um botão opt-in e usa chave do próprio usuário. A ordem é
parser determinístico primeiro; IA só se o layout derrotar a regex.
**Consequências.** O formulário de certificado precisa ser rápido de preencher na
mão, porque na maioria das vezes é isso que vai acontecer. Investir em UX de
formulário, não em mágica.

---

## ADR-04 — Multiusuário desde o dia 1, cadastro por convite

**Contexto.** Uso é pessoal, mas quem criar conta tem o próprio espaço.
**Decisão.** RLS em toda tabela, `user_id` em toda linha, bucket particionado por
`{user_id}/`. Cadastro exige código de convite de uso único.
**Por que convite.** 1GB de storage é compartilhado entre todos os usuários.
Cadastro aberto num free tier é convite a estourar a cota ou virar hospedagem
de arquivo alheio.
**Consequências.** Sem tela de "criar conta" pública. O resgate do convite roda no
servidor com service role, fora da RLS.

---

## ADR-05 — Roadmap linear, grafo só no acadêmico

**Contexto.** Roadmap de estudo e grade curricular parecem o mesmo problema, mas
não são. Roadmap é ordem que **você escolhe**; pré-requisito é restrição que a
universidade **impõe**.
**Decisão.** Roadmap é lista ordenada (`roadmap_steps.position`). O grafo dirigido
fica só em `subject_relations`.
**Consequências.** Menos código e menos tela para a parte que não precisa de grafo.
Se um dia o roadmap precisar de dependência real, o motor do módulo acadêmico é
reaproveitável — foi escrito puro, em `src/domain/academic/`.

---

## ADR-06 — Estrutura curricular por usuário, sem catálogo global

**Contexto.** Seria tentador ter uma tabela única de cadeiras por instituição,
compartilhada entre usuários da mesma faculdade.
**Decisão.** Cada usuário tem a própria cópia (`curricula` → `subjects`).
**Por quê.** Catálogo compartilhado exige área administrativa, curadoria,
versionamento por ano de ingresso e política de escrita compartilhada. É um
produto inteiro. Duplicar dado é mais barato que governar dado.
**Consequências.** Dois alunos do mesmo curso importam a mesma grade duas vezes.
Aceito. Mitigação futura: exportar/importar grade como JSON entre contas.

---

## ADR-07 — Histórico e estrutura curricular são fontes diferentes

**Contexto.** O histórico do SIGAA diz o que **já foi cursado** (código, nome,
carga horária, período, nota, situação). Ele **não** traz o catálogo completo nem
os pré-requisitos.
**Decisão.** Duas importações distintas: histórico alimenta `enrollments`;
estrutura curricular / fluxograma alimenta `subjects` + `subject_relations`.
**Consequências.** Sem a segunda fonte, "quais posso pegar" não existe — o grafo
fica vazio. Se a estrutura não sair do SIGAA, o fallback é cadastro manual das
obrigatórias, uma vez. O schema não muda nos dois cenários.

---

## ADR-08 — Certificado público mostra card, nunca o arquivo

**Contexto.** Certificado costuma trazer nome completo e, com frequência, CPF.
**Decisão.** O bucket é privado. O perfil público exibe metadados + link de
verificação da instituição. O arquivo só sai por signed URL de curta duração,
para o dono.
**Consequências.** Quem visita o perfil confere a autenticidade no emissor, não no
seu site. Isso é melhor do ponto de vista de confiança, além de mais seguro.

---

## ADR-09 — Vida acadêmica, missões e roadmap são sempre privados

**Decisão.** Não existe toggle público para `enrollments`, `subjects`, notas,
`missions`, `mission_logs`, `user_stats` e `roadmaps` — não há policy de leitura
pública nessas tabelas.
**Por quê.** Nota e reprovação são dado sensível, e streak exposto vira pressão
social sobre um sistema que existe para te ajudar, não para te cobrar em público.
**Público, com toggle individual:** certificados, repositórios e livros lidos.

---

## ADR-10 — GitHub: repositórios, não Projects

**Decisão.** A integração lista **repositórios**. GitHub Projects (boards) fica
fora.
**Por quê.** Projects v2 só tem API GraphQL, com modelo de dados próprio de
campos customizados. É um conector inteiro, para uma feature de uso incerto.
**Consequências.** Sync sob demanda com cache de 24h em `github_repos` (ADR-02).
Repositório privado aparece só para o dono, nunca no perfil público — garantido
por policy, não por filtro de aplicação.

---

## ADR-11 — Fuso do usuário, não do servidor

**Contexto.** Missão diária, streak e "hoje" dependem de dia civil.
**Decisão.** `profiles.timezone`, default `America/Fortaleza` (UTC-3, sem horário
de verão). Todo cálculo de "hoje" converte para o fuso do usuário.
**Consequências.** A Vercel roda em UTC. Uma missão concluída às 22h de João
Pessoa é 01h do dia seguinte em UTC — usar a data do servidor quebraria o streak
silenciosamente. Nenhuma função de domínio pode chamar `new Date()` sem receber o
fuso: a data "hoje" entra como parâmetro.
