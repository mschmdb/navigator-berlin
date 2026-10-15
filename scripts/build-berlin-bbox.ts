/**
 * scripts/build-berlin-bbox.ts
 *
 * Schreibt die Berlin-Bounding-Box (aus dem `bezirke`-Layer) als committete
 * Konstante nach `src/lib/data/berlin-bbox.generated.ts`. Das Runtime-Image
 * enthält `static/` nicht, daher kein Laufzeit-Lesen.
 *
 * Run: `pnpm data:berlin-bbox` (nach Änderung des `bezirke`-Layers).
 * `berlin-bbox.test.ts` schlägt bei Abweichung fehl.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { computeGeoJsonBbox } from '../src/lib/data/berlin-bbox.js';
import type { Manifest } from '../src/lib/data/types.js';

const layersDir = resolve(process.cwd(), 'static/layers');
const manifest = JSON.parse(
	await readFile(resolve(layersDir, 'MANIFEST.json'), 'utf-8')
) as Manifest;
const bezirke = manifest.layers.find((l) => l.slug === 'bezirke');
if (!bezirke) throw new Error('bezirke-Layer fehlt im MANIFEST.json');

const fc = JSON.parse(await readFile(resolve(layersDir, bezirke.filename), 'utf-8'));
const bbox = computeGeoJsonBbox(fc);
if (!bbox) throw new Error('bezirke-Layer ohne Koordinaten');

const out = `// Generiert von scripts/build-berlin-bbox.ts, nicht von Hand ändern.
import type { BboxTuple } from '$lib/seo/dataset-helpers.js';

/** Bounding Box der Bezirksgrenzen: [minLng, minLat, maxLng, maxLat]. */
export const BEZIRKE_BBOX: BboxTuple = [${bbox.join(', ')}];
`;
await writeFile(resolve(process.cwd(), 'src/lib/data/berlin-bbox.generated.ts'), out);
process.stdout.write(`BEZIRKE_BBOX: ${bbox.join(', ')}\n`);
