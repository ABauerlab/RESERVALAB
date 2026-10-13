# Captura do e-book (Google Sheets + Apps Script)

Fluxo: `/ebook` envia o formulário ao servidor do site, que valida, aplica antispam e chama o Apps Script. O PDF só é liberado depois que o script responde `ok: true` (`criado` ou `duplicado`). O PDF não fica em `/public`: sai por link assinado de 30 minutos.

## Configurar (uma vez)

1. Crie uma planilha no Google Sheets (nome sugerido: "Teggly Leads").
2. **Extensões → Apps Script**. Apague o código de exemplo e cole todo o `apps-script.gs`. Salve.
3. **Configurações do projeto (engrenagem) → Propriedades do script → Adicionar propriedade**: nome `SEGREDO`, valor uma senha longa e aleatória (mínimo 16 caracteres). Guarde-a num gerenciador de senhas.
4. No editor, escolha a função `configurar` e clique em **Executar**. Autorize o acesso quando o Google pedir. Isso cria a aba `Leads` com os cabeçalhos.
5. **Implantar → Nova implantação → Tipo: Aplicativo da Web**. *Executar como:* Eu. *Quem tem acesso:* Qualquer pessoa. Implantar e copiar a **URL do app da Web** (termina em `/exec`).
6. No servidor do site, defina as variáveis (nunca no código nem no navegador):
   - `EBOOK_APPS_SCRIPT_URL`: a URL `/exec`
   - `EBOOK_APPS_SCRIPT_SECRET`: o mesmo valor de `SEGREDO`
   - `EBOOK_TOKEN_SECRET`: texto aleatório longo (`openssl rand -hex 32`)
7. Abra a URL `/exec` no navegador: deve mostrar `{"ok":true,"servico":"teggly-ebook"}`.

Ao mudar o código do script, use **Implantar → Gerenciar implantações → Editar → Nova versão**. A URL continua a mesma.

## Respostas do script

| Resposta | Significado | O site faz |
|---|---|---|
| `{ok:true,status:"criado"}` | lead gravado | libera o PDF |
| `{ok:true,status:"duplicado"}` | e-mail já existia, nada novo gravado | libera o PDF e avisa que o pedido já existia |
| `{ok:false,erro:"limite"}` | muitos envios | mensagem de aguardar, não libera |
| `{ok:false,erro:"dados_invalidos" \| "nao_autorizado" \| "nao_configurado" \| "json" \| "indisponivel"}` | não gravou | mensagem de tentar de novo, não libera |

Falha de rede ou resposta fora do padrão também não libera o arquivo, e o formulário mantém os dados digitados.

## Colunas da aba `Leads`

`recebido_em`, `nome`, `negocio`, `email`, `whatsapp`, `instagram`, `origem`, `aviso_versao`. Duplicidade é verificada pelo e-mail (sem diferenciar maiúsculas).

## Privacidade e segurança

- O segredo só existe nas Propriedades do script e nas variáveis do servidor. O script não escreve dados pessoais nem o segredo em log.
- As colunas de dados são gravadas como texto puro: nenhum valor digitado vira fórmula.
- Compartilhe a planilha apenas com quem precisa. Ela contém dados pessoais (LGPD): defina quem acessa e por quanto tempo guarda.
