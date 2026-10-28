/**
 * Tailwind compilado (3.4.17, a mesma versão que o CDN servia).
 * Antes o CSS era gerado no navegador a cada visita, pelo script do CDN, e
 * isso atrasava a primeira pintura no telemóvel. Agora é gerado uma vez:
 *
 *   npm run css      -> assets/tailwind.css
 *
 * Correr de novo sempre que se acrescentarem classes Tailwind ao HTML ou
 * ao JS. O resultado fica no repositório: a Vercel serve-o tal como está,
 * sem passo de build.
 */
module.exports = {
  // O JS entra porque acrescenta classes em tempo de execução (menu,
  // formulários) e o i18n.js traz HTML com classes nas traduções.
  content: ['./index.html', './franquia/index.html', './carreiras/index.html', './assets/*.js'],
  theme: {
    extend: {
      // Paleta oficial (Guia de marca, jul/2026):
      //   #1D3054 navy · #C6C6C6 cinza · #E8AD00 âmbar · #FFCC00 amarelo
      // Os restantes tons são derivados destes quatro.
      colors: {
        navy: {
          950: '#0E1728',
          900: '#131F38',
          800: '#18294A',
          700: '#1D3054', // oficial
          600: '#26406E',
        },
        brand: {
          700: '#1D3054', // oficial
          600: '#26406E',
          500: '#33538A',
        },
        volt: {
          300: '#FFD84D',
          400: '#FFCC00', // oficial
          500: '#E8AD00', // oficial
        },
        cream: {
          50: '#F5F6F8',
          100: '#EAECF0',
        },
        ink: {
          950: '#1D3054', // oficial
        },
        ash: {
          300: '#C6C6C6', // oficial
        },
        steel: {
          400: '#9AA0AC',
          500: '#7A8190',
          600: '#5C6472',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'sans-serif'],
        body: ['"Montserrat"', 'sans-serif'],
      },
    },
  },
};
