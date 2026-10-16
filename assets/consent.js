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
  banner.innerHTML = `
    <h2 id="hb-consent-titulo" class="hb-consent-titulo" data-i18n="cookies.titulo">Cookies neste site</h2>
    <p id="hb-consent-texto" class="hb-consent-texto" data-i18n="cookies.texto">Usamos cookies do Google para contar as visitas e perceber que anúncios nos trazem clientes. Só ficam ativos se aceitares. Podes mudar de ideias quando quiseres em «Preferências de cookies», no rodapé.</p>

    <div id="hb-consent-painel" class="hb-consent-painel" hidden>
      <div class="hb-consent-opcao">
        <span class="hb-consent-opcao-texto">
          <span class="hb-consent-nome" data-i18n="cookies.essenciais">Essenciais</span>
          <span class="hb-consent-desc" data-i18n="cookies.essenciais.desc">Guardam o idioma que escolheste e esta preferência.</span>
        </span>
        <span class="hb-consent-fixo" data-i18n="cookies.sempre">Sempre ativos</span>
      </div>
      <label class="hb-consent-opcao">
        <span class="hb-consent-opcao-texto">
          <span class="hb-consent-nome" data-i18n="cookies.estatistica">Estatística</span>
          <span class="hb-consent-desc" data-i18n="cookies.estatistica.desc">Google Analytics. Mostra-nos quantas pessoas visitam o site e que páginas leem.</span>
        </span>
        <input type="checkbox" class="hb-switch focus-ring-dark" name="analytics" role="switch" />
      </label>
      <label class="hb-consent-opcao">
        <span class="hb-consent-opcao-texto">
          <span class="hb-consent-nome" data-i18n="cookies.publicidade">Publicidade</span>
          <span class="hb-consent-desc" data-i18n="cookies.publicidade.desc">Google Ads. Mostra-nos que anúncios levam a contactos e torna os anúncios mais úteis para ti.</span>
        </span>
        <input type="checkbox" class="hb-switch focus-ring-dark" name="ads" role="switch" />
      </label>
    </div>

    <div class="hb-consent-acoes">
      <button type="button" class="hb-consent-btn hb-consent-btn-sec focus-ring-dark spring" data-consent="recusar" data-i18n="cookies.recusar">Recusar</button>
      <button type="button" class="hb-consent-btn hb-consent-btn-pri focus-ring-dark spring" data-consent="aceitar" data-i18n="cookies.aceitar">Aceitar</button>
      <button type="button" class="hb-consent-btn hb-consent-btn-pri focus-ring-dark spring" data-consent="guardar" data-i18n="cookies.guardar" hidden>Guardar escolhas</button>
    </div>
    <button type="button" class="hb-consent-link focus-ring-dark" data-consent="personalizar" aria-expanded="false" aria-controls="hb-consent-painel" data-i18n="cookies.personalizar">Personalizar</button>
  `;
  document.body.appendChild(banner);

  const painel = banner.querySelector('#hb-consent-painel');
  const caixaAnalytics = banner.querySelector('[name="analytics"]');
  const caixaAds = banner.querySelector('[name="ads"]');
  const botao = (acao) => banner.querySelector(`[data-consent="${acao}"]`);
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  let quemAbriu = null;

  const mostrarPainel = (aberto) => {
    painel.hidden = !aberto;
    botao('aceitar').hidden = aberto;
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
    if (semMovimento.matches) esconder();
    else banner.addEventListener('transitionend', esconder, { once: true });
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
