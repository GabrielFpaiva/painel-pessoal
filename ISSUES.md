# Backlog

Cada item é uma tarefa fechada para o Claude Code, com critério de aceite.
Ordem importa dentro da fase. Não pule fase.

Antes de qualquer tarefa: leia `CLAUDE.md` e `DECISIONS.md`.
Toda tarefa herda o Definition of Done do `CLAUDE.md`.

---

# Fase 0 — Fundação

### 0.1 Bootstrap do projeto
Next.js (App Router) + TypeScript strict + Tailwind + shadcn/ui + `next-intl`.
Tokens de cor e as três famílias tipográficas do `CLAUDE.md` configurados no
Tailwind. Tema escuro e claro trocáveis, escuro default.
**Aceite:** `pnpm dev` sobe; página inicial troca de tema e de idioma; `tsc --noEmit` limpo.

### 0.2 Migration inicial
Aplicar `schema.sql` como primeira migration. Gerar os tipos TypeScript.
**Aceite:** migration aplica em banco limpo sem erro; `database.types.ts` gerado.

### 0.3 Auth por GitHub OAuth + convite
Login com GitHub. Rota de resgate de convite (service role) que cria o `profile`
com username validado. Middleware protegendo `(app)/`. Sem convite válido, sem conta.
**Aceite:** convite inválido, expirado ou já usado é rejeitado; usuário sem sessão
em `/dashboard` cai no login; username duplicado dá erro tratado no formulário.

### 0.4 Teste de isolamento por RLS
Fixture com dois usuários. Teste que, para **cada** tabela do schema, o usuário B
não lê nem escreve linha do usuário A.
**Aceite:** suíte falha se alguém adicionar tabela sem policy. Rode isso a cada fase.

### 0.5 Casca do app
Layout mobile-first: bottom nav de 4 abas + FAB de adicionar. No desktop, sidebar
e command palette `⌘K`. Estados vazio, carregando e erro padronizados.
**Aceite:** navegável a 390px com o polegar; `⌘K` navega e cria no desktop.

---

# Fase 1 — Certificados e livros

### 1.1 CRUD de certificados
Formulário com os campos do schema. Upload para o bucket privado no caminho
`{user_id}/{certificate_id}.{ext}`, teto de 5MB, imagem comprimida no client antes
de subir. Download por signed URL de curta duração.
**Aceite:** upload de PDF e de PNG; arquivo de 6MB é recusado com mensagem clara;
signed URL expira; usuário B não baixa arquivo de A.

### 1.2 Pré-preenchimento por camada de texto
`pdf.js` extrai o texto do PDF no browser e uma heurística sugere título,
instituição, data e carga horária. Campo sugerido nasce destacado e editável.
Sem texto extraível, o formulário abre vazio, sem erro.
**Aceite:** certificado digital comum preenche pelo menos título e instituição;
PDF escaneado (sem camada de texto) não quebra nada. **Não usa IA** (ADR-03).

### 1.3 Listagem, busca e tags
Grade de cards com busca por título e instituição, filtro por tag, instituição e
ano. Tags criadas na hora.
**Aceite:** busca responde a cada tecla sem travar a 390px.

### 1.4 Alerta de vencimento
Calculado no load: banner e badge para certificado vencendo em ≤60 dias ou já
vencido. Sem cron (ADR-02).
**Aceite:** teste de domínio cobre vencido, vencendo, sem data de validade.

### 1.5 CRUD de livros + Open Library
Busca por ISBN ou título na Open Library, com capa. Cadastro manual como fallback
quando a API não acha ou está fora.
**Aceite:** cadastro por ISBN traz capa e autor; API fora não impede cadastrar.

### 1.6 Progresso de leitura e ritmo
Registro de página lida por dia (`reading_progress`). Cálculo de páginas/dia e
previsão de término. Meta anual com contador.
**Aceite:** função pura em `src/domain/books/`, testada com histórico irregular,
dia sem leitura e livro sem total de páginas.

### 1.7 Notas de leitura
Notas em markdown, opcionalmente ancoradas numa página. Sempre privadas, mesmo em
livro público.
**Aceite:** nota nunca aparece em `/u/{username}`.

---

# Fase 2 — Módulo acadêmico

Fase mais difícil do projeto. Escreva o domínio e os testes **antes** da UI.

### 2.1 Domínio do grafo
Em `src/domain/academic/`, puro, sem I/O: cadeiras liberadas, cadeiras bloqueadas
com o motivo, e quantas cadeiras cada uma destrava. `waived` conta como concluída.
**Aceite:** testes cobrem cadeia de pré-requisitos em profundidade, co-requisito,
equivalência, e ciclo acidental na grade (não pode entrar em loop infinito).

### 2.2 Cadastro da estrutura curricular
Tela de CRUD de `curricula`, `subjects` e `subject_relations`. Importação e
exportação em JSON. Este é o caminho garantido — sem ele o módulo não anda.
**Aceite:** dá para montar uma grade de ~40 obrigatórias sem sair do teclado;
exportar e reimportar produz a mesma grade.

### 2.3 Importador do histórico
Upload do histórico em PDF. `pdf.js` extrai o texto, parser determinístico
identifica as linhas de cadeira (código, nome, carga horária, período, nota,
situação) e mostra uma **tela de conferência** antes de gravar em `enrollments`.
Cadeira que não casar com nenhuma `subject` é destacada para vínculo manual.
**Aceite:** nada é gravado sem confirmação na tela de conferência; reimportar o
mesmo histórico não duplica (`unique (user_id, subject_id, term)`).

### 2.4 Fallback de importação por IA
Só se 2.3 não der conta do layout. Botão opt-in, chave do próprio usuário, uma
chamada, mesma tela de conferência (ADR-03).
**Aceite:** sem chave configurada, o botão nem aparece; a chave nunca vai para o
bundle do client.

### 2.5 Tela "o que posso pegar"
Lista de liberadas, ordenada por período sugerido, com o número de cadeiras que
cada uma destrava. Bloqueadas mostram exatamente o que falta.
**Aceite:** legível a 390px; o impacto ("destrava 4") aparece sem clique.

### 2.6 Montagem de horário
Seleção de cadeiras do semestre, entrada manual de dia e faixa de horário,
detecção de conflito bloqueando a seleção e apontando o choque. Visualização em
grade semanal.
**Aceite:** detector de conflito é função pura testada com sobreposição parcial,
encaixe exato e dias diferentes; grade semanal usável no celular.

### 2.7 Integralização e coeficiente
Percentual de créditos concluídos e média ponderada por crédito, via
`academic_summary`. Dispensada entra no crédito, fica fora da média.
**Aceite:** confere com cálculo feito na mão a partir de um histórico real.

---

# Fase 3 — Cursos, roadmap e missões

### 3.1 CRUD de cursos
Plataforma, URL, carga horária, progresso em %, status. Ao concluir, oferecer
cadastro do certificado vinculado.
**Aceite:** concluir curso leva ao formulário de certificado já pré-preenchido
com título e instituição.

### 3.2 Roadmap linear
Lista ordenada de etapas com arrastar para reordenar, etapa podendo apontar para
um curso. Templates prontos para clonar (ADR-03: nada de geração por IA).
**Aceite:** reordenar persiste; concluir a última etapa fecha o roadmap.

### 3.3 Domínio das missões
Em `src/domain/missions/`: fila do dia (recorrentes do dia da semana + pontuais
com `due_on`), teto de 3, XP, streak, escudo semanal.
**Aceite crítico:** a apuração é **idempotente e retroativa** — abrir o app depois
de 5 dias sumido apura os 5 de uma vez, gasta no máximo 1 escudo por semana, e
rodar duas vezes no mesmo dia não muda nada. Teste com virada de semana, virada
de ano e usuário que mudou de fuso.

### 3.4 Tela de missões
Fila do dia, marcar como feita, criar avulsa, gerar missão a partir de etapa do
roadmap, de curso ou de cadeira em andamento.
**Aceite:** marcar como feita atualiza streak e XP na mesma interação, sem recarregar.

### 3.5 Dashboard
Missões do dia e streak no topo; depois cadeiras do semestre, livro atual e
progresso do roadmap. Alertas de vencimento entram aqui.
**Aceite:** uma tela de celular mostra o dia inteiro sem rolar até o rodapé.

---

# Fase 4 — Público e extras

### 4.1 Conexão com o GitHub
Guardar o token no Vault, sincronizar repositórios sob demanda com cache de 24h,
botão de atualizar agora. Toggle "mostrar no perfil" por repositório.
**Aceite:** repositório privado nunca sai no perfil público, mesmo se marcado —
provado por teste contra a policy, não por filtro na aplicação.

### 4.2 Perfil público
`/u/{username}`: certificados públicos (card + link de verificação, sem arquivo),
repositórios marcados, livros lidos. Renderizado no servidor, com metadados de
compartilhamento.
**Aceite:** anônimo não enxerga nada não marcado; perfil com `is_public = false`
retorna 404, não uma página vazia.

### 4.3 Exportação
Zip de todos os certificados, gerado sob demanda no servidor. Export completo da
conta em JSON.
**Aceite:** zip de 30 certificados não estoura o tempo limite da função.

### 4.4 Simulador de semestres
Planejar semestres futuros até formar: arrastar cadeira para um período e ver se
os pré-requisitos fecham e se o horário bate.
**Aceite:** reusa o domínio da Fase 2 sem duplicar regra.

### 4.5 PWA
Manifest, ícone, instalável. Shell offline com o último dashboard em cache.
**Aceite:** instala no Android e no iOS; offline mostra o cache, não tela de erro.

---

## Ficou de fora, de propósito

Lembretes externos (e-mail, push, bot) · GitHub Projects · geração de roadmap por
IA · integração com o vault do Obsidian · importação de Skoob, Goodreads e Kindle ·
professor, turma e sala · currículo em PDF gerado a partir dos certificados.

Nada disso está barrado por arquitetura. Cada um entra como fase própria quando
fizer falta de verdade.
