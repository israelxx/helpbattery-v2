/**
 * Põe ?v=<assinatura do conteúdo> nas referências ao CSS e ao JS dos HTML.
 *
 * Porquê: o Cloudflare (à frente da Vercel) obriga o browser a guardar
 * estes ficheiros 4 horas (Browser Cache TTL), mas o HTML vem sempre
 * fresco. Depois de um deploy, quem já tinha visitado o site ficava com o
 * HTML novo e o CSS/JS antigos: formulário, animações e banner partidos
 * até a cache expirar. Com a assinatura no URL, cada versão de um ficheiro
 * é um endereço novo, que nenhuma cache tem guardado.
 *
 * Correr sempre que mudar qualquer ficheiro de assets/*.css ou assets/*.js:
 *   npm run versao        (o `npm run css` já o corre no fim)
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';

const ASSETS = ['styles.css', 'tailwind.css', 'consent.js', 'i18n.js', 'app.js'];
const PAGINAS = ['index.html', 'franquia/index.html', 'carreiras/index.html'];

const assinatura = (ficheiro) =>
  createHash('sha1').update(fs.readFileSync('assets/' + ficheiro)).digest('hex').slice(0, 10);
const versoes = Object.fromEntries(ASSETS.map((f) => [f, assinatura(f)]));

for (const pagina of PAGINAS) {
  let html = fs.readFileSync(pagina, 'utf8');
  for (const [ficheiro, v] of Object.entries(versoes)) {
    const ref = new RegExp(`(/assets/${ficheiro.replace('.', '\\.')})(\\?v=[0-9a-f]+)?(?=")`, 'g');
    const encontradas = html.match(ref) || [];
    if (encontradas.length !== 1) throw new Error(`${pagina}: esperava 1 referência a ${ficheiro}, encontrei ${encontradas.length}`);
    html = html.replace(ref, `$1?v=${v}`);
  }
  fs.writeFileSync(pagina, html);
}
console.log('versões:', Object.entries(versoes).map(([f, v]) => `${f}=${v}`).join('  '));
