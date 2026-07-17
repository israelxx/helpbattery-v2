# CLAUDE.md — Regras do Frontend do Site

## Sempre Fazer Primeiro
- **Invocar a skill `frontend-design`** antes de escrever qualquer código de frontend, em toda sessão, sem exceções.
- **Invocar a skill `landing-page-copy`** antes de escrever qualquer copy da página.

## Imagens de Referência
- Se uma imagem de referência for fornecida: reproduza layout, espaçamento, tipografia e cores exatamente. Substitua por conteúdo placeholder (imagens via `https://placehold.co/`, texto genérico). Não melhore nem adicione elementos ao design.
- Se não houver imagem de referência: crie o design do zero com alto nível de acabamento (ver diretrizes abaixo).
- Tire um screenshot do resultado, compare com a referência, corrija as diferenças, tire outro screenshot. Faça pelo menos 2 rodadas de comparação. Só pare quando não houver diferenças visíveis ou quando o usuário indicar.

## Servidor Local
- **Sempre sirva em localhost** — nunca tire screenshot de uma URL `file:///`.
- Inicie o servidor de desenvolvimento: `node serve.mjs` (serve a raiz do projeto em `http://localhost:3002`)
- `serve.mjs` fica na raiz do projeto. Inicie-o em segundo plano antes de tirar qualquer screenshot.
- Se o servidor já estiver rodando, não inicie uma segunda instância.

## Fluxo de Screenshot
- O Puppeteer está instalado em `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/`. O cache do Chrome está em `C:/Users/nateh/.cache/puppeteer/`.
- **Sempre tire screenshot a partir do localhost:** `node screenshot.mjs http://localhost:3002`
- Os screenshots são salvos automaticamente em `./temporary screenshots/screenshot-N.png` (numeração incremental automática, nunca sobrescrita).
- Sufixo de rótulo opcional: `node screenshot.mjs http://localhost:3002 label` → salva como `screenshot-N-label.png`
- `screenshot.mjs` fica na raiz do projeto. Use-o como está.
- Após tirar o screenshot, leia o PNG em `temporary screenshots/` com a ferramenta Read — o Claude consegue ver e analisar a imagem diretamente.
- Ao comparar, seja específico: "o título está com 32px, mas a referência mostra ~24px", "o espaçamento entre cards está em 16px, mas deveria ser 24px"
- Verifique: espaçamento/padding, tamanho/peso/altura de linha da fonte, cores (hex exato), alinhamento, border-radius, sombras, dimensionamento de imagens

## Padrões de Saída
- Arquivo único `index.html`, todos os estilos inline, a menos que o usuário indique o contrário
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Imagens placeholder: `https://placehold.co/LARGURAxALTURA`
- Responsivo com abordagem mobile-first

## Ativos de Marca
- Sempre verifique a pasta `brand_assets/` antes de projetar. Ela pode conter logos, guias de cores, guias de estilo ou imagens.
- Se houver ativos ali, use-os. Não use placeholders quando houver ativos reais disponíveis.
- Se houver um logo, use-o. Se houver uma paleta de cores definida, use exatamente esses valores — não invente cores de marca.

## Diretrizes Anti-Genéricas
- **Cores:** Nunca use a paleta padrão do Tailwind (indigo-500, blue-600, etc.). Escolha uma cor de marca personalizada e derive as demais a partir dela.
- **Sombras:** Nunca use `shadow-md` chapada. Use sombras em camadas, com tonalidade de cor e baixa opacidade.
- **Tipografia:** Nunca use a mesma fonte para títulos e corpo de texto. Combine uma fonte display/serifada com uma sans-serif limpa. Aplique tracking apertado (`-0.03em`) em títulos grandes e altura de linha generosa (`1.7`) no corpo do texto.
- **Gradientes:** Sobreponha múltiplos gradientes radiais. Adicione textura/grão via filtro SVG de ruído para dar profundidade.
- **Animações:** Anime apenas `transform` e `opacity`. Nunca use `transition-all`. Use easing no estilo spring.
- **Estados interativos:** Todo elemento clicável precisa de estados de hover, focus-visible e active. Sem exceções.
- **Imagens:** Adicione uma sobreposição de gradiente (`bg-gradient-to-t from-black/60`) e uma camada de tratamento de cor com `mix-blend-multiply`.
- **Espaçamento:** Use tokens de espaçamento intencionais e consistentes — não passos aleatórios do Tailwind.
- **Profundidade:** As superfícies devem ter um sistema de camadas (base → elevada → flutuante), não devem estar todas no mesmo plano.

## Regras Rígidas
- Não adicione seções, funcionalidades ou conteúdo que não estejam na referência
- Não "melhore" um design de referência — reproduza-o
- Não pare depois de apenas uma rodada de screenshot
- Não use `transition-all`
- Não use azul/indigo padrão do Tailwind como cor primária
