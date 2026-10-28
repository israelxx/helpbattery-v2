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
 *
 * VERSÃO 2 — pré-registo de investidor (formulário em quatro passos)
 * As respostas novas (país, disponibilidade, experiência, ...) ganham
 * colunas próprias, acrescentadas DEPOIS das antigas: as linhas que já
 * estão na planilha não se desalinham. O cabeçalho dessas colunas é
 * escrito sozinho no primeiro envio. A coluna "mensagem" passa a guardar
 * um resumo legível de todas as respostas (é o que a v1 gravava).
 * Ao atualizar, mantém o ID_PLANILHA que já lá estava.
 */

// ---------------------------------------------------------------
// CONFIGURAÇÃO — preenche este valor
// ---------------------------------------------------------------

/** ID da planilha. Está no URL, entre /d/ e /edit */
const ID_PLANILHA = 'COLA_AQUI_O_ID_DA_PLANILHA';

/** Nome da aba. Tem de ser igual ao nome do separador na planilha. */
const NOME_ABA = 'candidaturas';

/**
 * Ordem das colunas. As nove primeiras são as da v1; as restantes vêm do
 * pré-registo de investidor e o cabeçalho delas é criado automaticamente.
 */
const COLUNAS = [
  'timestamp', 'nome', 'email', 'telefone', 'regiao',
  'modelo', 'mensagem', 'idioma', 'origem',
  'pais', 'rede_social', 'disponibilidade', 'participacao',
  'experiencia', 'prazo', 'canal', 'receber', 'horario',
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
  return responder({ ok: true, servico: 'franquia', versao: 2 });
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

    // Tudo o que não é timestamp nem modelo é texto livre vindo do site.
    const valores = { timestamp: new Date(), modelo: modelo };
    COLUNAS.forEach(function (c) {
      if (!(c in valores)) valores[c] = texto(dados[c]);
    });

    const aba = SpreadsheetApp.openById(ID_PLANILHA).getSheetByName(NOME_ABA);
    if (!aba) {
      return responder({ ok: false, erro: 'Aba "' + NOME_ABA + '" não encontrada' });
    }
    garantirCabecalho(aba);
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

/**
 * Escreve na linha 1 os nomes das colunas que ainda lá não estão.
 * Só preenche à direita da última coluna existente: nunca reescreve um
 * cabeçalho que alguém tenha mudado à mão na planilha.
 */
function garantirCabecalho(aba) {
  const existentes = aba.getLastColumn();
  if (existentes >= COLUNAS.length) return;
  const novas = COLUNAS.slice(existentes);
  aba.getRange(1, existentes + 1, 1, novas.length).setValues([novas]);
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
