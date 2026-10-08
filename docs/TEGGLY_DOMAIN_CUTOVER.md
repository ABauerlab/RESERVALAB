# Teggly: domínio teggly.com.br, auditoria e troca manual

Domínio oficial: **https://teggly.com.br**. O domínio antigo `reserva.bauerlab.com.br` **continua funcionando** até o dono fazer a troca. Nada foi alterado na Hostinger.

## 1. Auditoria do código

| Ocorrência                                                                | Classe                    | Ação                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `canonical`, `og:url`, `og:image`, `twitter:image` (home e root)          | URL pública               | Migrado para `SITE_URL` (`src/lib/site.ts`)                                                                                                                                          |
| `sitemap[.]xml.ts`, `public/sitemap.xml`, `public/robots.txt`             | URL pública               | Migrado (`https://teggly.com.br`)                                                                                                                                                    |
| Links de reserva, Link Hub e acompanhamento copiados/enviados pelo painel | URL pública               | Usam `window.location.origin`: seguem o domínio em que o dono está logado. Quem entrar por `teggly.com.br` gera links novos; até lá, saem com o domínio antigo (que continua válido) |
| Manifest/PWA (`api/public/manifest.webmanifest`)                          | URL pública               | `start_url` por tenant, relativo à origem                                                                                                                                            |
| Auth (login)                                                              | Infra                     | Só e-mail e senha, sem `redirectTo` nem signUp no código. Não há domínio fixo. Ajuste no Supabase é preventivo (item 3)                                                              |
| CORS, cookie domain                                                       | Infra                     | Não há no código                                                                                                                                                                     |
| `supabase/migrations/20260723...sql` (`reservatestelab.lovable.app`)      | Infra interna / histórica | Mantido. É o gatilho de aviso do app de teste antigo, não é URL pública                                                                                                              |
| `docs/database/LIVE_STATE.md`, auditoria, relatórios                      | Documentação / histórica  | Mantido                                                                                                                                                                              |
| n8n (mensagens com link, prompt do agente, base de conhecimento)          | Integração externa        | **Não alterado.** Ver item 4                                                                                                                                                         |

Busca final no código-fonte (`src`, `public`, `e2e`, `supabase` sem as migrations históricas): só restam as asserções de teste que garantem que o domínio antigo NÃO aparece.

## 2. Ordem recomendada (você faz, eu não toquei)

1. **Backup antes de tudo** (Hostinger hPanel): Backups, gerar backup completo do site e dos e-mails do plano; baixar uma cópia. A Hostinger avisou que a troca direta do domínio principal pode apagar backups, exigir recriação de subdomínios e afetar e-mail.
2. **Não use "trocar domínio principal"** se o plano tem e-mail ou subdomínios do bauerlab.com.br. Prefira **adicionar teggly.com.br como domínio/site novo apontando para a mesma aplicação**, mantendo `reserva.bauerlab.com.br` ativo. Confirme com o suporte da Hostinger qual dos dois caminhos preserva e-mail e backups no seu plano.
3. **DNS**: como `teggly.com.br` é gerenciado fora da Hostinger (registrador), use exatamente os registros que o assistente de domínio da Hostinger mostrar (normalmente A para a raiz e CNAME para `www`). Não copie valores de outro lugar. Não apague registros MX/TXT existentes (e-mail, verificação).
4. Aguardar propagação (até 24 h). O SSL é emitido automaticamente depois.
5. Me avisar. Só então valido https://teggly.com.br.

## 3. Configurações externas que dependem do domínio (manuais)

- **Supabase Auth** (projeto `wkvyhpfuezzinlaxsaap`, Authentication > URL Configuration): incluir `https://teggly.com.br` e `https://teggly.com.br/**` em Redirect URLs; trocar o Site URL para `https://teggly.com.br` somente depois que o domínio responder. Manter o antigo na lista durante a transição.
- **Lovable**: se o app é servido pelo publish do Lovable, conectar `teggly.com.br` em Project settings > Domains é o caminho alternativo ao da Hostinger. Decida qual é a hospedagem de produção antes de mexer no DNS.
- **PWA e push**: o navegador liga o app instalado e a permissão de notificação à origem. Quem instalou em `reserva.bauerlab.com.br` precisa reinstalar e reativar o aviso em `teggly.com.br`. Sessões de login também são por origem: será preciso entrar de novo.
- **Meta/Facebook Pixel**: se houver verificação de domínio, adicionar `teggly.com.br`.

## 4. n8n e WhatsApp (integração externa, sem mudança agora)

Mensagens, prompt do agente e base de conhecimento do n8n podem conter links `reserva.bauerlab.com.br/<slug>`. Enquanto o domínio antigo continuar vivo (redirecionando ou servindo), os links seguem funcionando. Depois da troca, o ideal é: (a) configurar redirecionamento 301 do domínio antigo para o novo e (b) atualizar os links no n8n em uma janela própria, com teste. Não mexi no workflow 9baadcbf.

## 5. Checklist de validação (depois da sua confirmação)

HTTPS e certificado; `/`, `/login`, `/<slug>`, `/<slug>/links`, `/<slug>/cardapio`; `robots.txt`; `sitemap.xml`; og:image; login e recuperação de senha; reserva pública; painel (Hoje, Reservas, Agenda, Clientes, Ajustes).
