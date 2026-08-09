  tailwind.config = {
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
