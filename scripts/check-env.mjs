#!/usr/bin/env node
// Roda antes do build (npm/bun "prebuild"). Falha alto e claro se as
// variáveis do Supabase não estiverem presentes, em vez de deixar o build
// terminar "com sucesso" e o app quebrar em produção com um erro escondido
// (foi exatamente isso que já aconteceu: sem essas variáveis, toda página
// de empresa aparecia como "Empresa não encontrada").

import { existsSync, readFileSync } from "node:fs";

// Carrega .env manualmente (sem depender de nenhum pacote): a maioria dos
// provedores injeta as variáveis via ambiente real, mas quando o build roda
// localmente ou via .env commitado, elas só existem nesse arquivo.
function loadDotEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv(new URL("../.env", import.meta.url));

const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error("\n❌ Build abortado: variável(is) de ambiente ausente(s):");
  for (const name of missing) console.error(`   - ${name}`);
  console.error(
    "\nEssas variáveis vêm do arquivo .env na raiz do projeto (ou de variáveis",
    "de ambiente configuradas no seu provedor de hospedagem). Sem elas, o",
    "app builda normalmente mas fica sem conseguir falar com o Supabase —",
    'e isso aparece para o usuário como "Empresa não encontrada" em qualquer',
    "página, sem nenhum erro visível.\n",
  );
  process.exit(1);
}

console.log("✓ Variáveis de ambiente do Supabase presentes.");
