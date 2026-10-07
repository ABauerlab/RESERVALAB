# Migrations F3 aplicadas em producao

Registro das mudancas aplicadas no banco de producao (`wkvyhpfuezzinlaxsaap`) durante a F3. **Documentacao apenas**: estes arquivos ficam fora de `supabase/migrations` de proposito, para nunca serem reaplicados automaticamente. Cada item traz o rollback.

| Data       | Migration                                        | O que faz                                                                                                                                                                                            | Rollback                                                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-07 | f3_confirmar_sem_notificar_exige_admin_do_tenant | `confirmar_reserva_sem_notificar` passa a exigir `auth.uid()` com `has_tenant_role` da reserva; execucao revogada de PUBLIC e anon                                                                   | recriar a funcao anterior (sem checagem) e `GRANT EXECUTE ... TO anon`                                                                                                                                                                                  |
| 2026-10-07 | fecha insert direto em reservas                  | `REVOKE INSERT ON reservas FROM anon, authenticated`; policy "Anyone can create reservations" restrita a `authenticated` com `WITH CHECK (false)`. Criacao so via `criar_reserva` (SECURITY DEFINER) | `GRANT INSERT ON public.reservas TO anon, authenticated;` e `ALTER POLICY "Anyone can create reservations" ON public.reservas TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants t WHERE t.id = reservas.tenant_id AND t.ativo = true));` |
| 2026-10-07 | f3_update_reserva_by_codigo_revalida_regras      | `update_reserva_by_codigo` revalida horario-limite, feriado, bloqueios e exclusividade (>50) quando data, horario ou quantidade mudam. Testada em transacao revertida (13 casos)                     | recriar a versao anterior (ver `live-functions.sql`, sem a revalidacao)                                                                                                                                                                                 |
| 2026-10-07 | f3_triggers_n8n_enviam_header_secreto            | `notificar_confirmacao_cliente` e `notificar_mudanca_reserva` enviam o header `x-teggly-secret` lido do Vault (`teggly_webhook_secret`); sem segredo, o envio segue como antes                       | recriar as funcoes sem o bloco do header                                                                                                                                                                                                                |

## Segredo do Vault

`teggly_webhook_secret` foi criado em `vault.secrets`. O mesmo valor esta no no de validacao dos workflows n8n "Confirmacao de Reserva (cliente)" e "Avisos de Reserva (dono)". Para rotacionar: atualizar o segredo no Vault e o valor no no "Validar segredo do banco" dos dois workflows. Recomendado: o proprietario substituir a comparacao literal por uma credencial Header Auth do n8n.

## Workflows n8n alterados

- Confirmacao de Reserva (cliente): novo no "Validar segredo do banco" apos o webhook. Rollback: restaurar a versao `8e794c4d`.
- Avisos de Reserva (dono): idem. Rollback: restaurar a versao `fc5790c0`.

## Pendencias (F3)

- Webhook de entrada do WhatsApp (EvolutionAPI) sem autenticacao: depende de configurar um header no webhook da EvolutionAPI (acao manual do proprietario).
- RPCs publicas usadas pelo n8n (lembretes, avisos, consulta por telefone, confirmar/cancelar por codigo): migrar para a credencial Postgres do n8n e so entao revogar de anon.
