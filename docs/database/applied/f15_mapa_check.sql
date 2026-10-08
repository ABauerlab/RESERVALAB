-- F15: o CHECK do mapa usava {10,2000}, acima do limite do Postgres (255), e falhava em todo salvamento
-- ("invalid repetition count(s)"). Recriado sem repeticao limitada; o tamanho continua limitado por char_length.
alter table public.tenant_perfil drop constraint tenant_perfil_hub_mapa_embed;
alter table public.tenant_perfil add constraint tenant_perfil_hub_mapa_embed check (
  hub_mapa_url is null or (
    char_length(hub_mapa_url) between 60 and 2100
    and hub_mapa_url ~ '^https://www[.]google[.]com/maps/embed[?]pb=[A-Za-z0-9%!._~:/?=&+,;()*@-]+$'
  )
);
-- Selo "Comida de Buteco" nao aparece mais no Link Hub (secao removida do painel).
update public.tenant_perfil set hub_selo = null where tenant_id = '13bb5e82-5d83-4db6-9fdc-aa0653bc83cc';
