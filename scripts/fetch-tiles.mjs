// Baixa os blocos do mapa (Esri World Street Map) da área de Salvador usada na demo,
// para a versão publicada em páginas do Claude, que bloqueiam imagens de outros domínios.
// Uso: node scripts/fetch-tiles.mjs <pastaDeSaida>
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] ?? 'dist-artifact/tiles';
const BOUNDS = { north: -12.955, south: -13.025, west: -38.552, east: -38.445 };
const ZOOMS = [12, 13, 14, 15, 16];

const lon2x = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2y = (lat, z) => Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z);

const jobs = [];
for (const z of ZOOMS) {
  for (let x = lon2x(BOUNDS.west, z); x <= lon2x(BOUNDS.east, z); x++)
    for (let y = lat2y(BOUNDS.north, z); y <= lat2y(BOUNDS.south, z); y++) jobs.push({ z, x, y });
}
console.log('tiles:', jobs.length);

let done = 0;
const queue = [...jobs];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const { z, x, y } = queue.shift();
    const dir = join(OUT, String(z), String(y));
    const file = join(dir, `${x}.jpg`);
    if (existsSync(file)) { done++; continue; }
    mkdirSync(dir, { recursive: true });
    const res = await fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`);
    if (!res.ok) { console.log('FAIL', z, y, x, res.status); continue; }
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    done++;
  }
}));
console.log('done', done);
