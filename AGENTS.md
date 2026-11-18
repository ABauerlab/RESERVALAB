<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Automações de WhatsApp (n8n + Supabase)

O atendimento (Dona Iracema), a confirmação, os lembretes e os avisos de
reserva rodam no n8n e usam funções do banco (migrations em
`supabase/migrations`). Regras para qualquer alteração:

- Editar um workflow pelo MCP só salva **rascunho**. Depois de editar,
  publicar e conferir que `activeVersionId` é igual a `versionId`
  (`sameAsDraft: true`). Rascunho esquecido já deixou links antigos no ar.
- Antes de editar, ler o estado atual: outras sessões também mexem nos
  workflows e podem ter alterado ou desconectado nós.
- Editar com operações pontuais (`addNode`, `setNodeParameter`,
  `addConnection`), nunca restaurar versão antiga nem recriar o workflow:
  uma edição feita a partir de cópia desatualizada já apagou a ferramenta de
  eventos em destaque e a base de conhecimento publicadas. Depois de publicar,
  reler o workflow e conferir os invariantes em
  `docs/WHATSAPP_IRACEMA_N8N.md`, que também guarda a cópia de recuperação da
  base de conhecimento. Mudou a base ou um nó listado lá? Atualize o doc no
  mesmo PR.
- Todo nó que depende de `$json.telefone` deve usar
  `$('Extrair mensagem').first().json.telefone` quando puder receber itens
  de ramos que não carregam o telefone (foi a causa de clientes sem resposta).
- Mensagens automáticas são texto fixo no n8n. A IA só entra em conversa
  livre, para economizar tokens.
- Avisos de reserva pendente: 7 dias e 2 dias antes, 1 vez por dia às 10h
  (Brasília). Cada aviso tem coluna própria (`aviso_confirmacao_7d_enviado`,
  `aviso_confirmacao_2d_enviado`). Colunas novas de controle entram como
  `true` nas reservas existentes para não disparar mensagens retroativas.
- Links oficiais: reservas `{dominio}/{slug}`, cardápio `{dominio}/{slug}/cardapio`, acompanhar
  `{dominio}/{slug}/acompanhar/{codigo}`, hub de links `{dominio}/{slug}/links` (o Linktree não é
  mais usado). `{dominio}` é `ia_agente_config.dominio_publico`: hoje
  `https://teggly.bauerlab.com.br`, voltará a `https://teggly.com.br`; trocar só lá.
- Horário-limite de reserva vem do cadastro (`tenants`) pelo bloco "DADOS AO VIVO DO TEGGLY" da
  base. Nunca escrever horário-limite como texto fixo na base.
- Botão de pausa da IA (geral e por conversa) está no Teggly; qualquer nó novo que responda
  cliente precisa passar pelo gate `ia_whatsapp_deve_responder`.
