// Converte dist-artifact/index.html no formato de página do Claude:
// sem <!doctype>/<html>/<head>/<body> (o publicador adiciona o esqueleto), <title> no topo.
// O JS embutido contém textos como "<body>", então os cortes usam só as bordas exatas do documento.
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2] ?? 'dist-artifact/index.html';
let html = readFileSync(file, 'utf8');

const start = html.indexOf('<head>') + '<head>'.length;
const boundary = html.match(/<\/head>\s*<body>\s*(?=<div id="root">)/);
const endBody = html.lastIndexOf('</body>');
if (start < 6 || !boundary || endBody < 0) throw new Error('estrutura inesperada do index.html');

const head = html.slice(start, boundary.index);
const body = html.slice(boundary.index + boundary[0].length, endBody);
const title = head.match(/<title>[^<]*<\/title>/)?.[0] ?? '<title>Sua Marca · Carnaval</title>';
const rest = head
  .replace(title, '')
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '');

html = `${title}\n${rest.trim()}\n${body.trim()}\n`;
writeFileSync(file, html);
console.log('ok', (html.length / 1024).toFixed(0) + ' KB');
