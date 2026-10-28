/* ==========================================================
   Help Battery — consentimento de cookies (RGPD)
   ----------------------------------------------------------
   O estado por omissão (tudo recusado) e a reposição da escolha
   guardada vivem no <head> de cada página, antes do gtag. Aqui
   fica só o banner e a gravação da escolha.

   Este ficheiro corre ANTES de app.js: o banner tem de existir
   quando o app.js captura os textos data-i18n, para o seletor de
   idioma também o traduzir. As traduções estão em i18n.js.
   ========================================================== */
(() => {
  const CHAVE = 'hb-consent';

  const banner = document.createElement('section');
  banner.id = 'hb-consent';
  banner.className = 'hb-consent';
  banner.hidden = true;
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'false');
  banner.setAttribute('aria-labelledby', 'hb-consent-titulo');
  banner.setAttribute('aria-describedby', 'hb-consent-texto');
  // Recusar e Aceitar: mesmo tamanho, ambos sólidos, lado a lado. É o que a
  // CNPD e o EDPB pedem: recusar tem de ser tão visível e fácil como aceitar.
  // O segundo nível (Personalizar) diz que cookies são, de quem e por quanto
  // tempo, e quem é o responsável: a informação que a lei manda dar antes
  // do consentimento.
  banner.innerHTML = `
    <span class="hb-consent-marca" aria-hidden="true"><img src="/new-logo/logo-icon.webp" alt="" width="641" height="641" decoding="async" /></span>
    <div class="hb-consent-copy">
      <h2 id="hb-consent-titulo" class="hb-consent-titulo" data-i18n="cookies.titulo">Escolhe como usamos cookies</h2>
      <p id="hb-consent-texto" class="hb-consent-texto" data-i18n="cookies.texto">A Help Battery usa cookies do Google para contar visitas e perceber que anúncios nos trazem clientes. Só ficam ativos se aceitares, e podes mudar de ideias quando quiseres em «Preferências de cookies», no rodapé.</p>
    </div>

    <div id="hb-consent-painel" class="hb-consent-painel" hidden>
      <div class="hb-consent-categorias">
        <div class="hb-consent-cat">
          <div class="hb-consent-cat-topo">
            <span class="hb-consent-nome" data-i18n="cookies.essenciais">Essenciais</span>
            <span class="hb-consent-fixo" data-i18n="cookies.sempre">Sempre ativos</span>
          </div>
          <p class="hb-consent-desc" data-i18n="cookies.essenciais.desc">Guardam o idioma que escolheste e esta preferência.</p>
          <details class="hb-consent-det"><summary data-i18n="cookies.ver">Ver cookies</summary><p data-i18n="cookies.essenciais.det">hb-lang e hb-consent, guardados no teu navegador pela Help Battery. A tua escolha fica guardada 6 meses.</p></details>
        </div>
        <div class="hb-consent-cat">
          <label class="hb-consent-cat-topo">
            <span class="hb-consent-nome" data-i18n="cookies.estatistica">Estatística</span>
            <input type="checkbox" class="hb-switch focus-ring" name="analytics" role="switch" aria-describedby="hb-consent-desc-analytics" />
          </label>
          <p id="hb-consent-desc-analytics" class="hb-consent-desc" data-i18n="cookies.estatistica.desc">Google Analytics. Mostra-nos quantas pessoas visitam o site e que páginas leem.</p>
          <details class="hb-consent-det"><summary data-i18n="cookies.ver">Ver cookies</summary><p data-i18n="cookies.estatistica.det">_ga e _ga_Y2GEW7E6K4, da Google. Duram até 2 anos.</p></details>
        </div>
        <div class="hb-consent-cat">
          <label class="hb-consent-cat-topo">
            <span class="hb-consent-nome" data-i18n="cookies.publicidade">Publicidade</span>
            <input type="checkbox" class="hb-switch focus-ring" name="ads" role="switch" aria-describedby="hb-consent-desc-ads" />
          </label>
          <p id="hb-consent-desc-ads" class="hb-consent-desc" data-i18n="cookies.publicidade.desc">Google Ads. Mostra-nos que anúncios levam a contactos e torna os anúncios mais úteis para ti.</p>
          <details class="hb-consent-det"><summary data-i18n="cookies.ver">Ver cookies</summary><p data-i18n="cookies.publicidade.det">_gcl_au, da Google, dura 90 dias. A Google pode também usar cookies nos seus próprios domínios para medir anúncios.</p></details>
        </div>
      </div>
      <p class="hb-consent-responsavel" data-i18n="cookies.responsavel">Os cookies de estatística e publicidade são da Google Ireland Limited, que pode tratar dados nos EUA ao abrigo do Quadro de Privacidade de Dados UE-EUA. Responsável pelo site: Help Battery, Rua Cidade do Porto, n.º 119, 4705-086 Braga, suporte@helpbattery.pt.</p>
    </div>

    <div class="hb-consent-acoes">
      <button type="button" class="hb-consent-btn hb-consent-btn-recusar focus-ring" data-consent="recusar" data-i18n="cookies.recusar">Recusar</button>
      <button type="button" class="hb-consent-btn hb-consent-btn-guardar focus-ring" data-consent="guardar" data-i18n="cookies.guardar" hidden>Guardar escolhas</button>
      <button type="button" class="hb-consent-btn hb-consent-btn-aceitar focus-ring" data-consent="aceitar" data-i18n="cookies.aceitar">Aceitar</button>
      <button type="button" class="hb-consent-link focus-ring" data-consent="personalizar" aria-expanded="false" aria-controls="hb-consent-painel" data-i18n="cookies.personalizar">Personalizar</button>
    </div>
  `;
  // No início do <body>: fica fixo no fundo do ecrã, mas é o primeiro sítio
  // onde o Tab chega. No fim, quem usa teclado tinha de atravessar a página.
  document.body.prepend(banner);

  const painel = banner.querySelector('#hb-consent-painel');
  const caixaAnalytics = banner.querySelector('[name="analytics"]');
  const caixaAds = banner.querySelector('[name="ads"]');
  const botao = (acao) => banner.querySelector(`[data-consent="${acao}"]`);
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  let quemAbriu = null;

  // Com o painel aberto, Aceitar continua à vista ao lado de Recusar e de
  // Guardar escolhas: abrir os detalhes não pode esconder nenhuma das saídas.
  const mostrarPainel = (aberto) => {
    painel.hidden = !aberto;
    banner.classList.toggle('is-detalhe', aberto);
    botao('guardar').hidden = !aberto;
    botao('personalizar').hidden = aberto;
    botao('personalizar').setAttribute('aria-expanded', String(aberto));
  };

  const abrir = (comPainel) => {
    const atual = window.hbConsent;
    caixaAnalytics.checked = !!(atual && atual.analytics);
    caixaAds.checked = !!(atual && atual.ads);
    mostrarPainel(comPainel);
    banner.hidden = false;
    // Um frame depois, para a transição partir do estado escondido.
    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('is-visible')));
  };

  const fechar = () => {
    banner.classList.remove('is-visible');
    const esconder = () => { banner.hidden = true; };
    // Só a transição de opacidade do próprio banner conta: a linha de carga
    // (::before) e os botões também disparam transitionend.
    const aoTerminar = (e) => {
      if (e.target !== banner || e.pseudoElement || e.propertyName !== 'opacity') return;
      banner.removeEventListener('transitionend', aoTerminar);
      esconder();
    };
    if (semMovimento.matches) esconder();
    else banner.addEventListener('transitionend', aoTerminar);
    if (quemAbriu) { quemAbriu.focus(); quemAbriu = null; }
  };

  // Ao retirar o consentimento, apaga os cookies que o Google já tinha
  // criado. Ficam no domínio raiz (.helpbattery.pt) ou no host atual.
  const apagarCookiesGoogle = (prefixos) => {
    const host = location.hostname;
    const dominios = [host, host.replace(/^www\./, '.'), ''];
    document.cookie.split(';').forEach((par) => {
      const nome = par.split('=')[0].trim();
      if (!prefixos.some((p) => nome.startsWith(p))) return;
      dominios.forEach((d) => {
        document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` + (d ? `; domain=${d}` : '');
      });
    });
  };

  const guardar = (analytics, ads) => {
    const escolha = { v: 1, analytics, ads, ts: Date.now() };
    try { localStorage.setItem(CHAVE, JSON.stringify(escolha)); } catch (e) { /* navegação privada */ }
    window.hbConsent = escolha;

    const estadoAds = ads ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: estadoAds,
        ad_user_data: estadoAds,
        ad_personalization: estadoAds,
        analytics_storage: analytics ? 'granted' : 'denied',
      });
    }
    if (!analytics) apagarCookiesGoogle(['_ga']);
    if (!ads) apagarCookiesGoogle(['_gcl']);
    fechar();
  };

  botao('aceitar').addEventListener('click', () => guardar(true, true));
  botao('recusar').addEventListener('click', () => guardar(false, false));
  botao('guardar').addEventListener('click', () => guardar(caixaAnalytics.checked, caixaAds.checked));
  botao('personalizar').addEventListener('click', () => {
    mostrarPainel(true);
    caixaAnalytics.focus();
  });

  // "Preferências de cookies" no rodapé reabre o banner já com as opções.
  document.querySelectorAll('[data-consent-open]').forEach((link) => {
    link.addEventListener('click', () => {
      quemAbriu = link;
      abrir(true);
      caixaAnalytics.focus({ preventScroll: true });
    });
  });

  // Escape só fecha quando já existe uma escolha: na primeira visita o
  // banner fica até o visitante decidir.
  banner.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && window.hbConsent) fechar();
  });

  if (!window.hbConsent) abrir(false);
})();
