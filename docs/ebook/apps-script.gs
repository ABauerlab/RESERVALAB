/**
 * Teggly | Recebe os leads do e-book e grava na planilha.
 *
 * Resposta (sempre JSON):
 *   { "ok": true,  "status": "criado" }     lead novo gravado
 *   { "ok": true,  "status": "duplicado" }  e-mail ja existia: nada foi gravado de novo
 *   { "ok": false, "erro": "<codigo>" }     nao gravou. Codigos: json, nao_autorizado,
 *                                           dados_invalidos, limite, indisponivel, nao_configurado
 * O site so libera o e-book quando recebe ok:true com status "criado" ou "duplicado".
 *
 * Seguranca: o segredo fica nas Propriedades do script (nunca neste codigo) e este arquivo nao
 * registra dados pessoais nem o segredo em log.
 *
 * Como configurar: ver README.md (docs/ebook/README.md).
 */

var NOME_ABA = "Leads";
var CABECALHO = [
  "recebido_em",
  "nome",
  "negocio",
  "email",
  "whatsapp",
  "instagram",
  "origem",
  "aviso_versao",
];
var COL_EMAIL = 4; // coluna D
var MAX_ENVIOS_POR_EMAIL_POR_HORA = 5;
var MAX_ENVIOS_GERAIS_POR_MINUTO = 30;
var TAMANHO_MAXIMO_CORPO = 4000;

function resposta_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Teste rapido no navegador: abrir a URL /exec. Nao expõe nenhum dado. */
function doGet() {
  return resposta_({ ok: true, servico: "teggly-ebook" });
}

/**
 * Rode UMA VEZ pelo editor (botao Executar) para autorizar o script e criar a aba Leads.
 * Tambem serve para conferir se o SEGREDO foi configurado: veja "Registro de execucao".
 */
function configurar() {
  var aba = abaLeads_();
  var segredo = PropertiesService.getScriptProperties().getProperty("SEGREDO");
  console.log("Aba pronta: " + aba.getName());
  console.log(
    segredo && segredo.length >= 16
      ? "SEGREDO configurado."
      : "ATENCAO: crie a propriedade SEGREDO (minimo 16 caracteres)."
  );
}

function abaLeads_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(NOME_ABA);
  if (!aba) aba = planilha.insertSheet(NOME_ABA);
  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO]).setFontWeight("bold");
    aba.setFrozenRows(1);
  }
  return aba;
}

function limpar_(valor, max) {
  return String(valor === null || valor === undefined ? "" : valor)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var segredoConfigurado = props.getProperty("SEGREDO");
  if (!segredoConfigurado || segredoConfigurado.length < 16) {
    return resposta_({ ok: false, erro: "nao_configurado" });
  }

  var bruto = e && e.postData && e.postData.contents ? e.postData.contents : "";
  if (!bruto || bruto.length > TAMANHO_MAXIMO_CORPO) {
    return resposta_({ ok: false, erro: "json" });
  }
  var dados;
  try {
    dados = JSON.parse(bruto);
  } catch (erro) {
    return resposta_({ ok: false, erro: "json" });
  }
  if (!dados || typeof dados !== "object" || dados.segredo !== segredoConfigurado) {
    return resposta_({ ok: false, erro: "nao_autorizado" });
  }

  var nome = limpar_(dados.nome, 100);
  var negocio = limpar_(dados.negocio, 100);
  var email = limpar_(dados.email, 160).toLowerCase();
  var whatsapp = String(dados.whatsapp || "").replace(/\D/g, "");
  var instagram = limpar_(dados.instagram, 40).toLowerCase().replace(/^@/, "");
  if (
    nome.length < 2 ||
    negocio.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ||
    !/^[1-9]{2}9?\d{8}$/.test(whatsapp) ||
    !/^[a-z0-9._]{1,30}$/.test(instagram)
  ) {
    return resposta_({ ok: false, erro: "dados_invalidos" });
  }

  // Limites de abuso: por e-mail (hora) e geral (minuto).
  var cache = CacheService.getScriptCache();
  var chaveEmail = "email:" + email;
  var porEmail = Number(cache.get(chaveEmail) || 0);
  var geral = Number(cache.get("geral") || 0);
  if (porEmail >= MAX_ENVIOS_POR_EMAIL_POR_HORA || geral >= MAX_ENVIOS_GERAIS_POR_MINUTO) {
    return resposta_({ ok: false, erro: "limite" });
  }
  cache.put(chaveEmail, String(porEmail + 1), 3600);
  cache.put("geral", String(geral + 1), 60);

  var trava = LockService.getScriptLock();
  try {
    trava.waitLock(15000);
  } catch (erro) {
    return resposta_({ ok: false, erro: "indisponivel" });
  }
  try {
    var aba = abaLeads_();
    var ultima = aba.getLastRow();
    if (ultima > 1) {
      var emails = aba.getRange(2, COL_EMAIL, ultima - 1, 1).getValues();
      for (var i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).trim().toLowerCase() === email) {
          return resposta_({ ok: true, status: "duplicado" });
        }
      }
    }
    // Colunas B a H gravadas como texto puro: nada vira formula e o WhatsApp nao perde zeros.
    var linha = aba.getLastRow() + 1;
    aba.getRange(linha, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss").setValue(new Date());
    aba
      .getRange(linha, 2, 1, CABECALHO.length - 1)
      .setNumberFormat("@")
      .setValues([
        [
          nome,
          negocio,
          email,
          whatsapp,
          instagram,
          limpar_(dados.origem || "ebook", 30),
          limpar_(dados.aviso_versao, 20),
        ],
      ]);
    SpreadsheetApp.flush(); // garante a gravacao antes de responder "criado"
    return resposta_({ ok: true, status: "criado" });
  } catch (erro) {
    return resposta_({ ok: false, erro: "indisponivel" });
  } finally {
    trava.releaseLock();
  }
}
