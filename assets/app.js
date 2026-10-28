  // Header scroll state
  const header = document.getElementById('site-header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconBurger = document.getElementById('icon-burger');
  const iconClose = document.getElementById('icon-close');
  let menuOpen = false;
  menuToggle.addEventListener('click', () => {
    menuOpen = !menuOpen;
    mobileMenu.classList.toggle('translate-x-full', !menuOpen);
    mobileMenu.classList.toggle('open', menuOpen);
    iconBurger.classList.toggle('hidden', menuOpen);
    iconClose.classList.toggle('hidden', !menuOpen);
    menuToggle.setAttribute('aria-expanded', String(menuOpen));
    document.body.style.overflow = menuOpen ? 'hidden' : '';
  });
  document.querySelectorAll('.mobile-link').forEach((link) => {
    link.addEventListener('click', () => menuToggle.click());
  });

  // ---------------------------------------------------------------
  // i18n
  // O português vive no HTML (bom para SEO e para quem edita a página).
  // O espanhol entra aqui como sobreposição: basta preencher I18N.es com
  // as mesmas chaves data-i18n e o botão ES ativa-se sozinho.
  // ---------------------------------------------------------------
  const I18N = window.HB_I18N || {};
  const LOCALES = { pt: 'pt-PT', br: 'pt-BR', es: 'es-ES' };
  const GUARDA = 'hb-lang';

  const temDicionario = (lang) =>
    lang === 'pt' || Object.keys(I18N[lang] || {}).length > 0;

  // Captura o pt-PT tal como está no HTML, antes de qualquer troca.
  // O <title> também entra aqui: definir o seu innerHTML muda o separador
  // do browser, por isso não precisa de tratamento especial.
  const PT = {};
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    PT[el.dataset.i18n] = el.innerHTML;
  });
  document.querySelectorAll('[data-i18n-content]').forEach((el) => {
    PT[el.dataset.i18nContent] = el.getAttribute('content');
  });

  // Idioma em uso. As mensagens dos formulários vivem no JS e não no DOM,
  // por isso precisam de saber em que língua responder.
  let langAtual = 'pt';

  const applyLang = (lang) => {
    langAtual = lang;
    const dict = lang === 'pt' ? PT : Object.assign({}, PT, I18N[lang] || {});

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = dict[el.dataset.i18n];
      if (value != null) el.innerHTML = value;
    });
    // meta description e afins, que guardam o texto no atributo content
    document.querySelectorAll('[data-i18n-content]').forEach((el) => {
      const value = dict[el.dataset.i18nContent];
      if (value != null) el.setAttribute('content', value);
    });

    document.documentElement.lang = LOCALES[lang] || 'pt-PT';
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    // Sem isto, passar da home para /franquia/ repunha o português.
    try { localStorage.setItem(GUARDA, lang); } catch (e) { /* navegação privada */ }

    // Textos montados pelo JS (ex.: "Passo 2 de 4") não têm data-i18n;
    // quem os escreve ouve este evento para os refazer no idioma novo.
    document.dispatchEvent(new CustomEvent('hb:idioma'));
  };

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const lang = btn.dataset.lang;
    // Um idioma só fica clicável se tiver tradução carregada.
    btn.disabled = !temDicionario(lang);
    if (!btn.disabled) btn.removeAttribute('title');
    btn.addEventListener('click', () => { if (!btn.disabled) applyLang(lang); });
  });

  // Repõe a escolha da visita anterior — mas só se esse idioma ainda estiver
  // oferecido na página. Sem esta validação, quem tivesse escolhido um idioma
  // entretanto retirado do seletor ficaria preso nele, sem botão para sair.
  const OFERECIDOS = [...document.querySelectorAll('.lang-btn')].map((b) => b.dataset.lang);
  let idiomaGuardado = null;
  try { idiomaGuardado = localStorage.getItem(GUARDA); } catch (e) { /* navegação privada */ }

  if (idiomaGuardado && !OFERECIDOS.includes(idiomaGuardado)) {
    try { localStorage.removeItem(GUARDA); } catch (e) { /* navegação privada */ }
    idiomaGuardado = null;
  }
  if (idiomaGuardado && idiomaGuardado !== 'pt' && temDicionario(idiomaGuardado)) {
    applyLang(idiomaGuardado);
  }

  // ---------------------------------------------------------------
  // Franquia: abre o formulário com o modelo escolhido
  // ---------------------------------------------------------------
  const franchiseWrap = document.getElementById('franchise-form-wrap');
  document.querySelectorAll('[data-open-form]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const model = btn.dataset.openForm;
      const form = franchiseWrap.querySelector('form');
      franchiseWrap.classList.remove('hidden');
      franchiseWrap.classList.add('is-visible');
      const opcao = form.querySelector('input[name="modelo"][value="' + model + '"]');
      if (opcao) opcao.checked = true;
      document.getElementById('franchise-form-title').textContent =
        msg('franquia.form.h3.' + (model === 'master' ? 'master' : 'micro'));
      // O formulário é por passos: o nome está no primeiro.
      form.dispatchEvent(new CustomEvent('hb:passo', { detail: 0 }));
      franchiseWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => document.getElementById('fr-nome').focus(), 500);
    });
  });

  // ---------------------------------------------------------------
  // Conversões do Google Ads
  // Clique em telefone, WhatsApp ou e-mail, e candidatura de franquia
  // enviada. O gtag envia por beacon, por isso o pedido sobrevive mesmo
  // que o link troque de página.
  // ---------------------------------------------------------------
  const ADS_ID = 'AW-16753329011';
  const CONVERSOES = {
    whatsapp: 'W_VwCKmK0u4ZEPOGzrQ-',
    telefone: '4abrCIXdw-4ZEPOGzrQ-',
    email: '-MMVCK7G0u4ZEPOGzrQ-',
    formulario: '3dafCJukhcwaEPOGzrQ-',
  };
  const converter = (tipo) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'conversion', { send_to: ADS_ID + '/' + CONVERSOES[tipo] });
  };

  // Delegado no documento para apanhar também os links que o JS injeta
  // (por exemplo, o e-mail na mensagem de erro dos formulários).
  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href.startsWith('tel:')) converter('telefone');
    else if (href.startsWith('mailto:')) converter('email');
    else if (/(api\.whatsapp\.com|wa\.me)\//.test(href)) converter('whatsapp');
  });

  // ---------------------------------------------------------------
  // Formulários
  // Cada formulário aponta para o seu Apps Script. Sem endpoint, fica
  // em pré-visualização: valida os campos mas não envia.
  // ---------------------------------------------------------------
  const ENDPOINTS = {
    carreiras: 'https://script.google.com/macros/s/AKfycbw35eqzWRs068rtJdHAIPOGI_6IvhCMADYhB4mEbej65VLkk63Is2DqL3f_t3xZAucxJg/exec',
    franquia: 'https://script.google.com/macros/s/AKfycbxd_00jXMDLy4FLSPlxX07hzqfgDAykTtcCxiUWBVmREUi1pNAVeXcEbME2FVQTiULa/exec',
  };

  const MAX_CV_MB = 5;

  // Mensagens de estado em pt-PT. As outras línguas sobrepõem-nas em
  // i18n.js, com as mesmas chaves.
  const MSG_PT = {
    'form.status.invalido': 'Confere os campos assinalados antes de enviar.',
    'form.status.enviando': 'A enviar…',
    'form.status.grande': 'O currículo tem mais de ' + MAX_CV_MB + ' MB. Envia um ficheiro mais pequeno.',
    'form.status.erro': 'Não foi possível enviar. Tenta de novo ou escreve para <a href="mailto:suporte@helpbattery.pt">suporte@helpbattery.pt</a>.',
    'form.status.sucesso.carreiras': 'Candidatura recebida. Se houver encaixe, entramos em contacto.',
    'form.status.sucesso.franquia': 'Candidatura recebida. A equipa de expansão entra em contacto para marcar a reunião.',
    'franquia.form.h3.master': 'Candidatura: Master Franqueado',
    'franquia.form.h3.micro': 'Candidatura: Micro Franqueado',
    'form.passo': 'Passo {n} de {t}',
    'form.status.previsualizacao':
      'Formulário em pré-visualização, o envio ainda não está ligado. ' +
      'Para falar connosco já, <a href="tel:+351253284398">liga 253 284 398</a> ou usa o WhatsApp.',
  };
  const msg = (chave) =>
    (I18N[langAtual] && I18N[langAtual][chave]) || MSG_PT[chave] || '';

  /** Lê o anexo como base64, que é o formato que o Apps Script descodifica. */
  const lerFicheiro = (ficheiro) => new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler o ficheiro'));
    leitor.onload = () => resolve({
      nome: ficheiro.name,
      tipo: ficheiro.type,
      // O resultado é uma data URL; a parte útil vem depois da vírgula.
      base64: String(leitor.result).split(',')[1] || '',
    });
    leitor.readAsDataURL(ficheiro);
  });

  /**
   * Pré-registo de investidor (franquia): acerta as respostas antes do envio.
   * O Apps Script publicado (v1) exige "regiao" e só grava as colunas que já
   * conhecia. Até a v2 (integracoes/franquia.gs) estar implementada, as
   * respostas novas seguem também num resumo legível no campo "mensagem",
   * para nenhuma se perder.
   */
  const RESUMO_FRANQUIA = [
    ['pais', 'País'], ['rede_social', 'Rede social'],
    ['disponibilidade', 'Disponibilidade'], ['participacao', 'Participação'],
    ['experiencia', 'Experiência'], ['prazo', 'Início'], ['regiao', 'Região'],
    ['canal', 'Como conheceu'], ['receber', 'Quer receber'], ['horario', 'Melhor horário'],
  ];
  const prepararFranquia = (dados) => {
    // Um campo escondido pode ter ficado com texto de uma escolha anterior.
    if (dados.regiao_definida !== 'Sim' || !dados.regiao) dados.regiao = 'Sem região definida';
    delete dados.regiao_definida;
    if (dados.canal === 'Outro' && dados.canal_outro) dados.canal = 'Outro: ' + dados.canal_outro;
    delete dados.canal_outro;
    dados.horario = [dados.horario, dados.horario_pref].filter(Boolean).join(', ');
    delete dados.horario_pref;
    dados.mensagem = RESUMO_FRANQUIA
      .filter(([chave]) => dados[chave])
      .map(([chave, rotulo]) => rotulo + ': ' + dados[chave])
      .join('\n');
  };

  /**
   * Os Apps Script gravam com appendRow, que lê cada valor como se alguém o
   * escrevesse na célula: "+351 912…" vira fórmula (#ERROR!) e "00351…"
   * perde os zeros. Um apóstrofo à frente obriga o Sheets a guardar texto e
   * não aparece na célula. No telefone vai sempre; nos outros campos só
   * quando começam por = + - @, o que também trava fórmulas injetadas.
   */
  const paraPlanilha = (dados) => {
    Object.keys(dados).forEach((chave) => {
      const valor = dados[chave];
      if (typeof valor !== 'string' || valor === '' || valor.startsWith("'")) return;
      if (chave === 'telefone' || /^[=+\-@]/.test(valor)) dados[chave] = "'" + valor;
    });
  };

  document.querySelectorAll('form.hb-form').forEach((form) => {
    const tipo = form.dataset.form;
    const endpoint = ENDPOINTS[tipo];
    const status = form.querySelector('.form-status');
    const botao = form.querySelector('[type="submit"]');
    const sucesso = form.parentElement.querySelector('[data-sucesso]');

    /** Assinala os obrigatórios em falta dentro de `escopo`. */
    const validar = (escopo) => {
      let valido = true;
      escopo.querySelectorAll('[required]').forEach((input) => {
        const campo = input.closest('.field');
        const ok = input.checkValidity() && input.value.trim() !== '';
        campo.classList.toggle('has-error', !ok);
        if (!ok) valido = false;
      });
      return valido;
    };
    const avisarErro = (escopo) => {
      status.innerHTML = msg('form.status.invalido');
      escopo.querySelector('.has-error input, .has-error select, .has-error textarea')?.focus();
    };

    // Campos que só aparecem com uma resposta concreta (data-se="nome=valor").
    // Escondidos deixam de ser obrigatórios, senão bloqueavam o envio.
    const condicionais = [...form.querySelectorAll('[data-se]')];
    const atualizarCondicionais = () => condicionais.forEach((bloco) => {
      const [nome, valor] = bloco.dataset.se.split('=');
      const marcado = form.querySelector('input[name="' + nome + '"]:checked');
      const visivel = !!marcado && marcado.value === valor;
      bloco.hidden = !visivel;
      if (!visivel) bloco.classList.remove('has-error');
      bloco.querySelectorAll('[data-obrigatorio]').forEach((input) => { input.required = visivel; });
    });
    form.addEventListener('change', atualizarCondicionais);
    atualizarCondicionais();

    // Formulário por passos: cada <fieldset class="form-step"> é um ecrã.
    // Sem JS ficam todos visíveis, por isso o markup só mostra o botão de
    // envio; Voltar e Continuar acendem-se aqui.
    const passos = [...form.querySelectorAll('.form-step')];
    const emPassos = passos.length > 1;
    let passo = 0;
    let mostrarPasso = () => {};
    if (emPassos) {
      const voltar = form.querySelector('[data-voltar]');
      const seguinte = form.querySelector('[data-seguinte]');
      const rotulo = form.querySelector('[data-passo-label]');
      const marcas = [...form.querySelector('[data-progresso]').children];
      const escreverRotulo = () => {
        rotulo.textContent = msg('form.passo').replace('{n}', passo + 1).replace('{t}', passos.length);
      };

      mostrarPasso = (i, focar) => {
        passo = i;
        passos.forEach((p, n) => p.classList.toggle('is-active', n === i));
        marcas.forEach((m, n) => m.classList.toggle('is-done', n <= i));
        voltar.hidden = i === 0;
        seguinte.hidden = i === passos.length - 1;
        botao.hidden = i !== passos.length - 1;
        escreverRotulo();
        status.innerHTML = '';
        if (focar) {
          // No telemóvel o botão Continuar fica abaixo da dobra: sem isto,
          // o passo seguinte começava fora do ecrã.
          if (form.getBoundingClientRect().top < 0) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
          passos[i].querySelector('.form-step-titulo')?.focus({ preventScroll: true });
        }
      };

      form.classList.add('is-stepped');
      rotulo.hidden = false;
      form.querySelector('[data-progresso]').hidden = false;
      mostrarPasso(0, false);

      seguinte.addEventListener('click', () => {
        if (validar(passos[passo])) mostrarPasso(passo + 1, true);
        else avisarErro(passos[passo]);
      });
      voltar.addEventListener('click', () => mostrarPasso(passo - 1, true));
      form.addEventListener('hb:passo', (event) => mostrarPasso(event.detail, false));
      document.addEventListener('hb:idioma', escreverRotulo);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      // Enter num campo de texto submete o formulário: antes do fim, avança.
      if (emPassos && passo < passos.length - 1) {
        form.querySelector('[data-seguinte]').click();
        return;
      }

      if (emPassos) {
        const falha = passos.findIndex((p) => !validar(p));
        if (falha !== -1) {
          mostrarPasso(falha, false);
          avisarErro(passos[falha]);
          return;
        }
      } else if (!validar(form)) {
        avisarErro(form);
        return;
      }

      if (!endpoint) {
        status.innerHTML = msg('form.status.previsualizacao');
        return;
      }

      const campoFicheiro = form.querySelector('input[type="file"]');
      const ficheiro = campoFicheiro && campoFicheiro.files[0];
      if (ficheiro && ficheiro.size > MAX_CV_MB * 1024 * 1024) {
        status.innerHTML = msg('form.status.grande');
        campoFicheiro.closest('.field')?.classList.add('has-error');
        return;
      }

      botao.disabled = true;
      status.innerHTML = msg('form.status.enviando');

      try {
        // Em vez de Object.fromEntries: caixas com o mesmo nome (o que quer
        // receber) chegam todas, juntas numa linha. O anexo (File) fica de
        // fora porque segue à parte, já em base64.
        const dados = {};
        for (const [chave, valor] of new FormData(form)) {
          if (typeof valor !== 'string') continue;
          dados[chave] = dados[chave] ? dados[chave] + '; ' + valor : valor;
        }
        if (tipo === 'franquia') prepararFranquia(dados);
        paraPlanilha(dados);
        dados.idioma = langAtual;
        dados.origem = window.location.href;
        if (ficheiro) dados.curriculo = await lerFicheiro(ficheiro);

        // text/plain de propósito: mantém o pedido "simples" e evita o
        // preflight OPTIONS, ao qual o Apps Script não responde.
        const resposta = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(dados),
        });
        const corpo = await resposta.json();
        if (!corpo.ok) throw new Error(corpo.erro || 'resposta sem ok');

        form.reset();
        atualizarCondicionais();
        if (sucesso) {
          // Um formulário de quatro passos não volta ao início com uma linha
          // de estado: a confirmação ocupa o lugar dele.
          mostrarPasso(0, false);
          form.hidden = true;
          sucesso.hidden = false;
          sucesso.focus();
        } else {
          status.innerHTML = msg('form.status.sucesso.' + tipo);
        }
        // Carreiras fica de fora: candidatos a emprego não são clientes.
        if (tipo === 'franquia') converter('formulario');
      } catch (err) {
        console.error('[formulário ' + tipo + ']', err);
        status.innerHTML = msg('form.status.erro');
      } finally {
        botao.disabled = false;
      }
    });

    form.querySelectorAll('input, select, textarea').forEach((input) => {
      const limpar = () => input.closest('.field')?.classList.remove('has-error');
      input.addEventListener('input', limpar);
      input.addEventListener('change', limpar); // opções de escolha
    });
  });

  // Scroll reveal
  // O CSS só esconde estes elementos depois de .reveal-ativo entrar no
  // <html>. Até aqui estavam visíveis: numa rede de telemóvel lenta, as
  // secções ficavam em branco à espera deste script, que é o último da
  // página. O que já está no ecrã (ou acima) fica visível de vez; só o que
  // está abaixo passa a esperar pelo scroll para entrar.
  const revealEls = document.querySelectorAll('.reveal, .reveal-scale');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
    else io.observe(el);
  });
  document.documentElement.classList.add('reveal-ativo');

  // ---------------------------------------------------------------
  // Compatibilidade com os links antigos
  // Antes da divisão em páginas, "franquia" e "carreiras" eram âncoras
  // da home. Links já partilhados (#franquia, #carreiras) continuam a
  // funcionar: são reencaminhados para a página correspondente.
  // ---------------------------------------------------------------
  const LEGACY_ROUTES = { '#franquia': '/franquia/', '#carreiras': '/carreiras/' };
  const isHome = ['/', '/index.html'].includes(window.location.pathname);
  const redirectLegacyHash = () => {
    const target = LEGACY_ROUTES[window.location.hash];
    if (isHome && target) window.location.replace(target);
  };
  redirectLegacyHash();
  window.addEventListener('hashchange', redirectLegacyHash);

  // ---------------------------------------------------------------
  // Carrossel 3D das marcas
  // Porta em JS puro do efeito de cilindro (o original era React +
  // framer-motion; este site é HTML estático e não tem build step).
  // Constrói-se a partir da grelha que já existe no HTML, por isso
  // não há markup duplicado: os logótipos têm uma única fonte.
  // ---------------------------------------------------------------
  (() => {
    const grelha = document.getElementById('brand-grid');
    if (!grelha) return;

    const logos = Array.from(grelha.querySelectorAll('img'));
    const total = logos.length;
    if (total < 3) return;

    const mqReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqPequeno = window.matchMedia('(max-width: 640px)');

    // --- construção do DOM -------------------------------------------------
    const carrossel = document.createElement('div');
    carrossel.className = 'brand-carousel';

    const palco = document.createElement('div');
    palco.className = 'brand-carousel-stage';

    const anel = document.createElement('div');
    anel.className = 'brand-carousel-ring';
    anel.tabIndex = 0;
    anel.setAttribute('role', 'group');
    anel.setAttribute('aria-label', 'Marcas compatíveis, arraste ou use as setas para rodar');

    const faces = logos.map((logo) => {
      const face = document.createElement('div');
      face.className = 'brand-face';
      const cartao = document.createElement('div');
      cartao.className = 'brand-face-card';
      const img = logo.cloneNode(true);
      // Mantém loading="lazy": são 187 KB de logótipos numa secção abaixo
      // da dobra, e o lazy loading do site foi uma otimização deliberada.
      img.setAttribute('draggable', 'false');
      cartao.appendChild(img);
      face.appendChild(cartao);
      anel.appendChild(face);
      return face;
    });

    palco.appendChild(anel);
    carrossel.appendChild(palco);
    grelha.insertAdjacentElement('afterend', carrossel);

    // A dica "Arraste para rodar" vive no HTML da home, para participar
    // no i18n como qualquer outro texto. Aqui só se move para a posição certa.
    const dica = document.querySelector('.brand-carousel-dica');
    if (dica) carrossel.insertAdjacentElement('afterend', dica);

    grelha.classList.add('is-visible');
    document.body.classList.add('carousel-ativo');

    // --- geometria do cilindro ---------------------------------------------
    let raio = 0;
    const medir = () => {
      const larguraCilindro = mqPequeno.matches ? 1800 : 3000;
      const larguraFace = larguraCilindro / total;
      raio = larguraCilindro / (2 * Math.PI);
      anel.style.width = larguraCilindro + 'px';
      faces.forEach((face, i) => {
        face.style.width = larguraFace + 'px';
        face.style.marginLeft = -(larguraFace / 2) + 'px';
        face.style.marginTop = -(larguraFace / 2) + 'px';
        face.style.transform =
          'rotateY(' + (i * (360 / total)) + 'deg) translateZ(' + raio + 'px)';
      });
    };

    // --- movimento ----------------------------------------------------------
    let rotacao = 0;
    let velocidade = 0;      // graus por frame, herdada do arrasto
    let aArrastar = false;
    let pausado = false;
    let ultimoX = 0;

    const VEL_AMBIENTE = 0.055; // rotação lenta em repouso
    const ATRITO = 0.94;        // decaimento da inércia
    const SENSIBILIDADE = 0.18; // px de arrasto -> graus

    const desenhar = () => {
      anel.style.transform = 'rotate3d(0, 1, 0, ' + rotacao + 'deg)';
    };

    const passo = () => {
      if (!aArrastar) {
        if (Math.abs(velocidade) > 0.02) {
          rotacao += velocidade;
          velocidade *= ATRITO;
          desenhar();
        } else if (!pausado && !mqReduzido.matches) {
          rotacao += VEL_AMBIENTE;
          desenhar();
        }
      }
      requestAnimationFrame(passo);
    };

    // --- arrasto -------------------------------------------------------------
    anel.addEventListener('pointerdown', (ev) => {
      aArrastar = true;
      velocidade = 0;
      ultimoX = ev.clientX;
      anel.setPointerCapture(ev.pointerId);
    });

    anel.addEventListener('pointermove', (ev) => {
      if (!aArrastar) return;
      const delta = (ev.clientX - ultimoX) * SENSIBILIDADE;
      ultimoX = ev.clientX;
      rotacao += delta;
      velocidade = delta;
      desenhar();
    });

    const largar = (ev) => {
      if (!aArrastar) return;
      aArrastar = false;
      if (ev.pointerId !== undefined) {
        try { anel.releasePointerCapture(ev.pointerId); } catch (e) { /* já libertado */ }
      }
    };
    anel.addEventListener('pointerup', largar);
    anel.addEventListener('pointercancel', largar);

    // --- pausa e teclado ------------------------------------------------------
    const pausar = () => { pausado = true; };
    const retomar = () => { pausado = false; };
    carrossel.addEventListener('mouseenter', pausar);
    carrossel.addEventListener('mouseleave', retomar);
    anel.addEventListener('focus', pausar);
    anel.addEventListener('blur', retomar);

    anel.addEventListener('keydown', (ev) => {
      const salto = 360 / total;
      if (ev.key === 'ArrowLeft') { velocidade = 0; rotacao += salto; desenhar(); ev.preventDefault(); }
      if (ev.key === 'ArrowRight') { velocidade = 0; rotacao -= salto; desenhar(); ev.preventDefault(); }
    });

    // --- arranque -------------------------------------------------------------
    medir();
    desenhar();
    requestAnimationFrame(passo);
    window.addEventListener('resize', medir);
})();
