# F4: fuso America/Sao_Paulo (aplicado em producao em 2026-10-07)

Migration `f4_rpcs_usam_fuso_america_sao_paulo` (documentacao, nao reaplicar).

- `bloqueios_do_tenant`, `feriados_do_tenant` e `proximo_evento_do_tenant`: `current_date` (UTC) passou a `(now() AT TIME ZONE 'America/Sao_Paulo')::date`. Antes, entre 21h e 24h em Brasilia, bloqueios, feriados e o proximo evento do dia sumiam.
- `reservas_para_lembrete_24h`: a janela comparava a hora local da casa (`data + horario`, sem fuso) com `now()` em UTC, o que deslocava a janela em 3 horas. Agora compara com `now() AT TIME ZONE 'America/Sao_Paulo'`.
- As janelas de 7 e 2 dias ja usavam `America/Sao_Paulo`.

Rollback: recriar as funcoes com `current_date` e `now()` (ver `live-functions.sql` em `docs/database`).

No frontend, `src/lib/datetime.ts` e a fonte unica de "hoje" e "agora".
