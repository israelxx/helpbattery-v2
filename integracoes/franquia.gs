/**
 * Help Battery — receção de candidaturas a franquia (/franquia/)
 * ---------------------------------------------------------------
 * Onde isto vive: Google Apps Script, ligado à planilha da franquia.
 * Não corre no site. O site apenas faz POST para o URL desta Web App.
 *
 * Ao contrário do carreiras.gs, este não tem anexos: não toca no Drive
 * e não precisa de pasta nenhuma. Só uma constante a preencher.
 *
 * COMO PUBLICAR
 *  1. Abre a planilha > Extensões > Apps Script
 *  2. Apaga o conteúdo do Code.gs e cola este ficheiro
 *  3. Preenche ID_PLANILHA
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
// CONFIGURAÇÃO — preenche este valor
// ---------------------------------------------------------------

/** ID da planilha. Está no URL, entre /d/ e /edit */
const ID_PLANILHA = 'COLA_AQUI_O_ID_DA_PLANILHA';

/** Nome da aba. Tem de ser igual ao nome do separador na planilha. */
const NOME_ABA = 'candidaturas';

/** Ordem das colunas. Tem de ser igual à linha 1 da planilha. */
const COLUNAS = [
  'timestamp', 'nome', 'email', 'telefone', 'regiao',
  'modelo', 'mensagem', 'idioma', 'origem',
];

/**
 * Valores aceites no campo "modelo". O formulário só oferece estes três,
 * mas quem faça POST direto ao URL pode enviar outra coisa — e uma coluna
 * com valores livres deixa de servir para filtrar.
 */
const MODELOS = ['master', 'micro', 'indeciso'];

// ---------------------------------------------------------------
// Ponto de entrada
// ---------------------------------------------------------------

/**
 * Teste de vida. Abre o URL /exec no browser: deve responder
 * {"ok":true,...}. Se responder outra coisa, a implementação
 * está mal publicada e não vale a pena testar o formulário.
 */
function doGet() {
  return responder({ ok: true, servico: 'franquia', versao: 1 });
}

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    const obrigatorios = ['nome', 'email', 'telefone', 'regiao', 'modelo'];
    const emFalta = obrigatorios.filter(function (c) {
      return !dados[c] || String(dados[c]).trim() === '';
    });
    if (emFalta.length) {
      return responder({ ok: false, erro: 'Campos em falta: ' + emFalta.join(', ') });
    }

    const modelo = texto(dados.modelo).toLowerCase();
    if (MODELOS.indexOf(modelo) === -1) {
      return responder({ ok: false, erro: 'Modelo inválido: ' + modelo });
    }

    const valores = {
      timestamp: new Date(),
      nome: texto(dados.nome),
      email: texto(dados.email),
      telefone: texto(dados.telefone),
      regiao: texto(dados.regiao),
      modelo: modelo,
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
