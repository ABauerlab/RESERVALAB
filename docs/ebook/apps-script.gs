/**
 * Teggly: recebe leads do e-book e grava na planilha.
 *
 * Instalacao (uma vez):
 * 1. Abra a planilha de leads > Extensoes > Apps Script e cole este arquivo.
 * 2. Configuracoes do projeto > Propriedades do script: crie SEGREDO (uma senha longa e aleatoria)
 *    e, se quiser, ABA (nome da aba, padrao "Leads").
 * 3. Implantar > Nova implantacao > Aplicativo da Web. Executar como: eu. Quem tem acesso: qualquer pessoa.
 * 4. Copie a URL /exec para EBOOK_APPS_SCRIPT_URL e o mesmo SEGREDO para EBOOK_APPS_SCRIPT_SECRET no servidor.
 * O segredo nunca vai para o navegador.
 */
var CABECALHO = ["recebido_em", "nome", "negocio", "email", "whatsapp", "instagram", "origem", "aviso_versao"];

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, erro: "json" });
  }
  if (!d || d.segredo !== props.getProperty("SEGREDO")) return json_({ ok: false, erro: "nao_autorizado" });

  var nome = String(d.nome || "").trim().slice(0, 100);
  var negocio = String(d.negocio || "").trim().slice(0, 100);
  var email = String(d.email || "").trim().toLowerCase().slice(0, 160);
  var whatsapp = String(d.whatsapp || "").replace(/\D/g, "");
  var instagram = String(d.instagram || "").trim().toLowerCase();
  if (nome.length < 2 || negocio.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ||
      !/^[1-9]{2}9?\d{8}$/.test(whatsapp) || !/^[a-z0-9._]{1,30}$/.test(instagram)) {
    return json_({ ok: false, erro: "dados_invalidos" });
  }

  // Limite por e-mail: no maximo 5 envios por hora.
  var cache = CacheService.getScriptCache();
  var chave = "n:" + email;
  var n = Number(cache.get(chave) || 0);
  if (n >= 5) return json_({ ok: false, erro: "limite" });
  cache.put(chave, String(n + 1), 3600);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(props.getProperty("ABA") || "Leads");
    if (!aba) {
      aba = SpreadsheetApp.getActiveSpreadsheet().insertSheet(props.getProperty("ABA") || "Leads");
    }
    if (aba.getLastRow() === 0) aba.appendRow(CABECALHO);
    var emails = aba.getLastRow() > 1 ? aba.getRange(2, 4, aba.getLastRow() - 1, 1).getValues() : [];
    for (var i = 0; i < emails.length; i++) {
      if (String(emails[i][0]).toLowerCase() === email) return json_({ ok: true, status: "duplicado" });
    }
    // Evita formula injetada na planilha.
    function seguro(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; }
    aba.appendRow([
      new Date(), seguro(nome), seguro(negocio), email, "'" + whatsapp, seguro(instagram),
      String(d.origem || "ebook").slice(0, 30), String(d.aviso_versao || "").slice(0, 20),
    ]);
    return json_({ ok: true, status: "criado" });
  } finally {
    lock.releaseLock();
  }
}
