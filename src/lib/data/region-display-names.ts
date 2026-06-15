import { normalizeSlug } from './internal/slug.js';
import { buildKiezSlugs, type KiezNameRef } from './internal/kiez-slug.js';
import type { Manifest } from './types.js';

/**
 * Slug → Anzeigename für Kieze (LOR-Bezirksregionen) und Bezirke.
 *
 * Behebt slug-rekonstruierte Namen wie „Suedliche Luisenstadt" oder
 * „Friedrichshain Kreuzberg": Anzeigenamen kommen direkt aus dem GeoJSON
 * (`BZR_NAME` / `Gemeinde_name`), die Slugs über dieselbe `buildKiezSlugs`-
 * Logik wie Profile + Sitemap, damit Map-Keys exakt zu den Routen passen.
 */
export interface RegionDisplayNames {
	readonly kiez: ReadonlyMap<string, string>;
	readonly bezirk: ReadonlyMap<string, string>;
}

interface FeatureCollectionLike {
	readonly features: ReadonlyArray<{ readonly properties?: Record<string, unknown> | null }>;
}

interface BuildInput {
	readonly lorFc: FeatureCollectionLike;
	readonly bezirkeFc: FeatureCollectionLike;
}

/**
 * Pure: baut beide Maps aus bereits geladenen Feature-Collections.
 * Testbar ohne Dateizugriff.
 */
/** Mehrfach-Whitespace im Quell-GeoJSON glätten (z.B. „Südliche  Friedrichstadt"). */
function cleanName(raw: string): string {
	return raw.replace(/\s+/g, ' ').trim();
}

export function buildRegionDisplayNames({ lorFc, bezirkeFc }: BuildInput): RegionDisplayNames {
	const bezirk = new Map<string, string>();
	const bezCodeToName = new Map<string, string>();
	for (const f of bezirkeFc.features) {
		const props = f.properties ?? {};
		const schluessel = props.Schluessel_gesamt;
		const name = props.Gemeinde_name;
		if (typeof schluessel === 'string' && typeof name === 'string') {
			const clean = cleanName(name);
			bezCodeToName.set(schluessel.slice(-2), clean);
			bezirk.set(normalizeSlug(clean), clean);
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
		const bezirkName = bez ? bezCodeToName.get(bez) ?? '' : '';
		refs.push({ name: cleanName(name), bezirk: bezirkName });
	}

	const slugs = buildKiezSlugs(refs);
	const kiez = new Map<string, string>();
	slugs.forEach((slug, idx) => {
		kiez.set(slug, refs[idx].name);
	});

	return { kiez, bezirk };
}

/**
 * Liest MANIFEST + GeoJSON (Build-Time via Node-`fs`, kein fetch-Kontext)
 * und liefert die Anzeigenamen-Maps. Spiegelt `readKiezSlugsFromGeoJson`.
 */
export async function readRegionDisplayNames(): Promise<RegionDisplayNames> {
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
	const lorFc = JSON.parse(lorRaw) as FeatureCollectionLike;
	const bezirkeFc = JSON.parse(bezirkeRaw) as FeatureCollectionLike;

	return buildRegionDisplayNames({ lorFc, bezirkeFc });
}
