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
- Todo nó que depende de `$json.telefone` deve usar
  `$('Extrair mensagem').first().json.telefone` quando puder receber itens
  de ramos que não carregam o telefone (foi a causa de clientes sem resposta).
- Mensagens automáticas são texto fixo no n8n. A IA só entra em conversa
  livre, para economizar tokens.
- Avisos de reserva pendente: 7 dias e 2 dias antes, 1 vez por dia às 10h
  (Brasília). Cada aviso tem coluna própria (`aviso_confirmacao_7d_enviado`,
  `aviso_confirmacao_2d_enviado`). Colunas novas de controle entram como
  `true` nas reservas existentes para não disparar mensagens retroativas.
- Links oficiais: reservas `https://teggly.com.br/{slug}`, cardápio
  `https://teggly.com.br/{slug}/cardapio`, acompanhar
  `https://teggly.com.br/{slug}/acompanhar/{codigo}`.
