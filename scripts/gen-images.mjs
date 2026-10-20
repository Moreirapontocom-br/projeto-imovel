// Gera fotos ilustrativas dos imóveis via Higgsfield (z_image) e baixa como webp.
import { execFile } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const S = ', real estate listing photography, natural daylight, wide angle, photorealistic, sharp, no people, no text, no watermark';
const JOBS = {
  'brr-01': [
    'Bright apartment living room in Barra, Salvador, Brazil, wide balcony with glass railing facing the ocean and a historic white lighthouse in the distance, light wood floor, navy blue sofa, rattan details',
    'Cozy master bedroom with white linen, wooden headboard, ocean view window, tropical plants, neutral tones',
    'Apartment balcony with two lounge chairs overlooking the Atlantic ocean at golden hour, Salvador Bahia coastline',
  ],
  'brr-02': [
    'Compact modern studio apartment, double bed and small sofa in one room, white and light oak furniture, window to the sea, Salvador Brazil',
    'Small modern kitchenette with white cabinets, light stone counter, two stools, tidy and bright',
    'Small studio bathroom with white tiles, glass shower box, wooden vanity, bright and clean',
  ],
  'brr-03': [
    'Spacious family apartment living and dining room, large wooden dining table for eight, white walls, blue cushions, window with view of a calm bay with boats, Porto da Barra, Salvador',
    'Kids bedroom with two single beds, light blue bedding, wooden furniture, bright window',
    'Fully equipped modern kitchen with island, white cabinets, wood details, pendant lights',
  ],
  'ond-04': [
    'High floor apartment living room with floor to ceiling windows and panoramic Atlantic ocean view, Ondina, Salvador, white sofa, light wood floor, minimalist',
    'Bedroom with ocean view through large window, white bedding, beige and navy accents',
    'Residential building facade on the seaside avenue of Ondina, Salvador, modern white tower with balconies, palm trees, blue sky',
  ],
  'ond-05': [
    'Luxury penthouse rooftop terrace with private pool and wooden deck, panoramic ocean view, lounge chairs, Salvador Bahia',
    'Elegant penthouse living room, double height ceiling, large windows to the sea, cream sofas, warm wood, designer lighting',
    'Luxury master suite with king bed, walk in closet visible, soft beige palette, sea view',
  ],
  'rvm-06': [
    'Colorful renovated townhouse in Rio Vermelho, Salvador, Brazil, facade painted in soft yellow with blue windows, small front garden, cobblestone street',
    'Large open living room in a renovated house, high ceilings, wooden beams, colorful Brazilian art on walls, comfortable sofas',
    'Backyard patio with hammock, tropical plants and outdoor dining table, string lights, Salvador house',
  ],
  'rvm-07': [
    'Bohemian loft apartment with exposed brick wall, mezzanine bed, vintage furniture, plants and warm lighting, Rio Vermelho, Salvador',
    'Loft kitchen with open shelves, tiles in blue and white pattern, wooden counter, plants',
    'Small balcony of a loft with plants and a view of colorful houses and the sea, Salvador',
  ],
  'grc-08': [
    'Classic apartment living room in Graca neighborhood, Salvador, parquet floor, high ceiling, white walls, mid century furniture, tree view from window',
    'Quiet bedroom with double bed, white linen, wooden wardrobe, soft light',
    'Leafy quiet residential street with tall trees and elegant apartment buildings, Graca, Salvador, Brazil',
  ],
  'vit-09': [
    'Elegant apartment living room on Corredor da Vitoria, Salvador, large windows facing the Bay of All Saints, sunset light, sophisticated decor',
    'Dining room with round marble table and six chairs, bay view behind, elegant apartment',
    'Bedroom with bay view, white and navy decor, wooden floor',
  ],
  'cgr-10': [
    'Apartment living room with large windows overlooking a wide tree lined avenue and a city square, Campo Grande, Salvador, Brazil, comfortable sofas',
    'Bedroom with two double beds for a group, simple modern decor, clean and bright',
    'Apartment balcony overlooking a busy wide avenue with trees, Campo Grande, Salvador, daytime',
  ],
  'pit-11': [
    'Residential condominium swimming pool area surrounded by palm trees, lounge chairs, modern apartment towers, Pituba, Salvador',
    'Modern family apartment living room, gray sofa, light floor, wooden coffee table, balcony door, bright',
    'Modern apartment kitchen with gray cabinets and white counters, breakfast bar',
  ],
  'pel-12': [
    'Restored colonial townhouse facade in Pelourinho, Salvador, Brazil, pastel blue walls, tall wooden windows, cobblestone street, historic center',
    'Colonial house interior living room, tall ceilings, original wooden floor, white walls, antique furniture mixed with modern pieces',
    'Colonial bedroom with tall wooden shutters open, four poster bed with white linen, terracotta floor tiles',
  ],
};

const tasks = [];
for (const [id, prompts] of Object.entries(JOBS)) prompts.forEach((p, i) => tasks.push({ file: `${id}-${i + 1}.webp`, prompt: p + S }));

const log = [];
function run(t) {
  return new Promise((resolve) => {
    const dest = join(OUT, t.file);
    if (existsSync(dest)) return resolve();
    execFile('higgsfield', ['generate', 'create', 'z_image', '--prompt', `"${t.prompt}"`, '--aspect_ratio', '4:3', '--wait', '--json'], { shell: true, maxBuffer: 1e7 }, async (err, stdout) => {
      try {
        if (err) throw err;
        const job = JSON.parse(stdout)[0];
        const url = job.min_result_url || job.result_url;
        const res = await fetch(url);
        writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
        log.push({ file: t.file, prompt: t.prompt, model: 'higgsfield z_image', job: job.id });
        console.log('ok', t.file);
      } catch (e) { console.log('FAIL', t.file, String(e).slice(0, 200)); }
      resolve();
    });
  });
}

const queue = [...tasks];
await Promise.all(Array.from({ length: 1 }, async () => { while (queue.length) await run(queue.shift()); }));
writeFileSync(join(OUT, 'provenance.json'), JSON.stringify(log, null, 2));
console.log('done', log.length);
