/**
 * Help Battery — receção de candidaturas de /carreiras/
 * ---------------------------------------------------------------
 * Onde isto vive: Google Apps Script, ligado à planilha das candidaturas.
 * Não corre no site. O site apenas faz POST para o URL desta Web App.
 *
 * COMO PUBLICAR
 *  1. Abre a planilha > Extensões > Apps Script
 *  2. Apaga o conteúdo do Code.gs e cola este ficheiro
 *  3. Preenche as duas constantes abaixo (ID_PLANILHA e ID_PASTA_CV)
 *  4. Implementar > Nova implementação > tipo "Aplicação Web"
 *       Executar como .......: Eu
 *       Quem tem acesso .....: Qualquer pessoa
 *  5. Autoriza (o aviso de "app não verificada" é normal: é o teu script)
 *  6. Copia o URL que termina em /exec e envia-o ao programador
 *
 * IMPORTANTE: sempre que editares este código, tens de fazer
 * "Implementar > Gerir implementações > editar > Nova versão".
 * Sem isso, o URL continua a servir a versão antiga.
 */

// ---------------------------------------------------------------
// CONFIGURAÇÃO — preenche estes dois valores
// ---------------------------------------------------------------

/** ID da planilha. Está no URL, entre /d/ e /edit */
const ID_PLANILHA = 'COLA_AQUI_O_ID_DA_PLANILHA';

/** ID da pasta do Drive onde ficam os currículos. Está no URL, depois de /folders/ */
const ID_PASTA_CV = 'COLA_AQUI_O_ID_DA_PASTA';

/** Nome da aba. Tem de ser igual ao nome do separador na planilha. */
const NOME_ABA = 'candidaturas';

/** Ordem das colunas. Tem de ser igual à linha 1 da planilha. */
const COLUNAS = [
  'timestamp', 'nome', 'email', 'telefone', 'cidade',
  'area', 'curriculo_url', 'mensagem', 'idioma', 'origem',
];

/** Limite do anexo, alinhado com o que o formulário aceita. */
const MAX_MB = 5;

// ---------------------------------------------------------------
// Ponto de entrada
// ---------------------------------------------------------------

/**
 * Teste de vida. Abre o URL /exec no browser: deve responder
 * {"ok":true,...}. Se responder outra coisa, a implementação
 * está mal publicada e não vale a pena testar o formulário.
 */
function doGet() {
  return responder({ ok: true, servico: 'carreiras', versao: 1 });
}

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    // Campos que o formulário marca como obrigatórios. A validação já é
    // feita no browser, mas quem faz POST direto ao URL contorna-a.
    const obrigatorios = ['nome', 'email', 'telefone', 'cidade', 'area'];
    const emFalta = obrigatorios.filter(function (c) {
      return !dados[c] || String(dados[c]).trim() === '';
    });
    if (emFalta.length) {
      return responder({ ok: false, erro: 'Campos em falta: ' + emFalta.join(', ') });
    }

    const urlCurriculo = guardarCurriculo(dados);

    const valores = {
      timestamp: new Date(),
      nome: texto(dados.nome),
      email: texto(dados.email),
      telefone: texto(dados.telefone),
      cidade: texto(dados.cidade),
      area: texto(dados.area),
      curriculo_url: urlCurriculo,
      mensagem: texto(dados.mensagem),
      idioma: texto(dados.idioma),
      origem: texto(dados.origem),
    };

    const aba = SpreadsheetApp.openById(ID_PLANILHA).getSheetByName(NOME_ABA);
    if (!aba) {
      return responder({ ok: false, erro: 'Aba "' + NOME_ABA + '" não encontrada' });
    }
    aba.appendRow(COLUNAS.map(function (c) { return valores[c]; }));

    return responder({ ok: true });
  } catch (err) {
    console.error(err);
    return responder({ ok: false, erro: String(err) });
  }
}

// ---------------------------------------------------------------
// Currículo → Drive
// ---------------------------------------------------------------

/**
 * O Sheets não guarda ficheiros: o anexo vai para o Drive e a célula
 * fica apenas com o link. Devolve '' quando não há anexo, porque o
 * currículo é opcional no formulário.
 */
function guardarCurriculo(dados) {
  const cv = dados.curriculo;
  if (!cv || !cv.base64) return '';

  const bytes = Utilities.base64Decode(cv.base64);
  if (bytes.length > MAX_MB * 1024 * 1024) {
    throw new Error('Currículo acima de ' + MAX_MB + ' MB');
  }

  const blob = Utilities.newBlob(
    bytes,
    cv.tipo || 'application/octet-stream',
    nomeDoFicheiro(dados.nome, cv.nome)
  );
  return DriveApp.getFolderById(ID_PASTA_CV).createFile(blob).getUrl();
}

/**
 * "2026-08-10_Maria-Silva.pdf" — assim a pasta fica ordenável por data
 * e legível sem abrir cada ficheiro.
 */
function nomeDoFicheiro(nome, nomeOriginal) {
  const data = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'yyyy-MM-dd');
  const limpo = String(nome || 'candidato')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim().replace(/\s+/g, '-') || 'candidato';
  const partes = String(nomeOriginal || '').split('.');
  const ext = partes.length > 1 ? partes.pop().toLowerCase() : 'pdf';
  return data + '_' + limpo + '.' + ext;
}

// ---------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------

function texto(v) {
  return v == null ? '' : String(v).trim();
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
