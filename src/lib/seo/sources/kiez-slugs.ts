import { buildKiezSlugs, type KiezNameRef } from '$lib/data/internal/kiez-slug.js';
import type { Manifest } from '$lib/data/types.js';

/**
 * Story 2.4 Helper: liest die 143 Kiez-Slugs (LOR-Bezirksregionen 2021) aus
 * `lor-bezirksregion`-GeoJSON. Build-Time-Pfad via Node-`fs` weil
 * SvelteKit `entries()` ohne fetch-Kontext aufruft.
 *
 * Slug-Konvention via `buildKiezSlugs`: eindeutige Namen → bare Slug, Duplikate
 * (nur "Heerstraße": Spandau + Charlottenburg-Wilmersdorf) → Bezirk-Suffix.
 * Bezirk-Name kommt aus dem `bezirke`-Layer über die letzten 2 Stellen von
 * `Schluessel_gesamt` (= LOR-`BEZ`-Code). Konsistent mit `get-kiez-profile`.
 */
export async function readKiezSlugsFromGeoJson(): Promise<string[]> {
	const { readFile } = await import('node:fs/promises');
	const { resolve: pathResolve } = await import('node:path');

	const manifestPath = pathResolve(process.cwd(), 'static/layers/MANIFEST.json');
	const manifestRaw = await readFile(manifestPath, 'utf-8');
	const manifest = JSON.parse(manifestRaw) as Manifest;

	const lorLayer = manifest.layers.find((l) => l.slug === 'lor-bezirksregion');
	if (!lorLayer) throw new Error('lor-bezirksregion-Layer fehlt im MANIFEST.json');
	const bezirkeLayer = manifest.layers.find((l) => l.slug === 'bezirke');
	if (!bezirkeLayer) throw new Error('bezirke-Layer fehlt im MANIFEST.json');

	const [lorRaw, bezirkeRaw] = await Promise.all([
		readFile(pathResolve(process.cwd(), 'static/layers', lorLayer.filename), 'utf-8'),
		readFile(pathResolve(process.cwd(), 'static/layers', bezirkeLayer.filename), 'utf-8')
	]);
	const lorFc = JSON.parse(lorRaw) as { features: { properties?: Record<string, unknown> }[] };
	const bezirkeFc = JSON.parse(bezirkeRaw) as {
		features: { properties?: Record<string, unknown> }[];
	};

	const bezCodeToName = new Map<string, string>();
	for (const f of bezirkeFc.features) {
		const props = f.properties ?? {};
		const schluessel = props.Schluessel_gesamt;
		const name = props.Gemeinde_name;
		if (typeof schluessel === 'string' && typeof name === 'string') {
			bezCodeToName.set(schluessel.slice(-2), name);
		}
	}

	const refs: KiezNameRef[] = [];
	for (const feature of lorFc.features) {
		const props = feature.properties ?? {};
		const name =
			typeof props.BZR_NAME === 'string'
				? props.BZR_NAME
				: typeof props.NAME === 'string'
					? props.NAME
					: null;
		if (!name) continue;
		const bez = typeof props.BEZ === 'string' ? props.BEZ : null;
		const bezirk = bez ? bezCodeToName.get(bez) ?? '' : '';
		refs.push({ name, bezirk });
	}

	return buildKiezSlugs(refs).sort();
}
