# Estado real do banco de producao (snapshot de 2026-10-07)

Documentacao somente leitura do projeto Supabase de producao (`wkvyhpfuezzinlaxsaap`), extraida por consultas de catalogo. **Nao e uma migration e nao deve ser aplicada.** Segredos e URLs privadas foram substituidos por `<REDACTED>`.

## Qual projeto e producao

- O bundle publico de `reserva.bauerlab.com.br` referencia o projeto `wkvyhpfuezzinlaxsaap`. O n8n e o gatilho de lembretes tambem usam esse projeto.
- O `.env` versionado aponta para outro projeto (backend de desenvolvimento do Lovable). Ele nao e producao.
- O deployment antigo `reservatestelab.lovable.app` (titulo "ReservaLab") e um app de teste anterior. O gatilho `notify_new_reserva` de producao ainda chama esse app.

## Drift de migrations

O banco de producao tem 19 migrations registradas. O repositorio tem 14 arquivos em `supabase/migrations` com versoes e nomes diferentes. As migrations abaixo existem so em producao (sem arquivo equivalente):

- `20260821173224 horario_limite_reservas_por_empresa`
- `20260824005321 add_motivo_cancelamento_e_mensagem_cancelamento`
- `20260901200811 add_pixel_facebook_id_to_tenants`
- `20260903184434 add_feriados_table_and_criar_reserva_holiday_rule`
- `20260914213951 add_reconfirmacao_de_reserva`
- `20260914214848 add_eventos_destaque`
- `20260921200605 add_observacao_area_to_tenants`
- `20261006124344 add_specific_area_enum_values`
- `20261006125243 add_confirmar_sem_notificar_cliente`
- `20261006130354 add_cancelamento_autonomo_e_filtro_avisos`
- `20261006133623 revoke_public_execute_on_trigger_functions`
- `20261007135707 aviso_confirmacao_7_dias`
- `20261007140935 aviso_confirmacao_2d_no_show`

Regra: **o repositorio nao e a fonte da verdade do banco de producao** ate o estado ser reconciliado. Nenhuma migration nova deste repositorio deve ser aplicada em producao sem conferir este documento. Mudancas futuras devem ser aditivas e versionadas junto com a documentacao.

## Tabelas (public) e RLS

Todas com RLS ligada (sem FORCE): `agenda_bloqueios`, `eventos_destaque`, `feedbacks`, `feriados`, `n8n_chat_histories_iracema` (sem policy), `push_subscriptions`, `reservas`, `tenants`, `user_roles`. `anon` e `authenticated` possuem todos os privilegios de tabela (padrao Supabase); a protecao e a RLS. Realtime: publicacao `supabase_realtime` somente com `reservas`; REPLICA IDENTITY `default`. Fuso do banco: UTC. Extensoes relevantes: `pg_net`, `pgcrypto`, `supabase_vault`, `uuid-ossp`. Nao ha buckets de storage nem pg_cron.

## Triggers (public.reservas)

| Trigger                         | Evento                 | Funcao                                       |
| ------------------------------- | ---------------------- | -------------------------------------------- |
| trg_reservas_codigo             | BEFORE INSERT          | gen_reserva_codigo                           |
| trg_reservas_updated            | BEFORE UPDATE          | update_updated_at_column                     |
| trg_notify_new_reserva          | AFTER INSERT           | notify_new_reserva (push)                    |
| trg_reserva_confirmacao_cliente | AFTER INSERT OR UPDATE | notificar_confirmacao_cliente (n8n, cliente) |
| trg_reserva_insert_notify       | AFTER INSERT           | notificar_mudanca_reserva (n8n, dono)        |
| trg_reserva_update_notify       | AFTER UPDATE           | notificar_mudanca_reserva (n8n, dono)        |

## Funcoes e permissao de execucao

| Funcao                                                                                                                                      | Executa                |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| criar_reserva                                                                                                                               | anon, authenticated    |
| get_reserva_by_codigo, update_reserva_by_codigo, cancelar_reserva_por_codigo, confirmar_reserva_por_codigo                                  | PUBLIC (anon)          |
| confirmar_reserva_sem_notificar(uuid)                                                                                                       | PUBLIC (anon)          |
| reserva_por_telefone_do_tenant, reservas_para_lembrete_24h, reservas_para_aviso_7d, reservas_para_aviso_2d, reservas_para_aviso_pendente_2d | PUBLIC (anon)          |
| marcar_lembrete_24h_enviado, marcar_aviso_7d_enviado, marcar_aviso_2d_enviado                                                               | PUBLIC (anon)          |
| bloqueios_do_tenant                                                                                                                         | anon, authenticated    |
| feriados_do_tenant, proximo_evento_do_tenant                                                                                                | PUBLIC (anon)          |
| has_role, has_tenant_role, get_my_tenant_id                                                                                                 | authenticated          |
| notify*new_reserva, notificar*\*, gen_reserva_codigo, update_updated_at_column                                                              | postgres, service_role |

## Definicoes relevantes

As definicoes completas das funcoes estao em `live-functions.sql` (somente referencia).
