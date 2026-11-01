import { buildKiezSlugs } from '$lib/data/internal/kiez-slug.js';

/** LOR-Bezirkscode (`BEZ`, zweistellig) → Bezirksname, wie im Bezirke-Layer. */
const BEZIRK_NAMES: Readonly<Record<string, string>> = {
	'01': 'Mitte',
	'02': 'Friedrichshain-Kreuzberg',
	'03': 'Pankow',
	'04': 'Charlottenburg-Wilmersdorf',
	'05': 'Spandau',
	'06': 'Steglitz-Zehlendorf',
	'07': 'Tempelhof-Schöneberg',
	'08': 'Neukölln',
	'09': 'Treptow-Köpenick',
	'10': 'Marzahn-Hellersdorf',
	'11': 'Lichtenberg',
	'12': 'Reinickendorf'
};

interface LorFeatureLike {
	readonly properties: { readonly BZR_NAME?: unknown; readonly BEZ?: unknown } | null;
}

/**
 * Kiez-Slug der Bezirksregion an `index`, disambiguiert wie die Wahl-Pipeline
 * (`buildKiezSlugs`): Doppelte Namen wie „Heerstraße“ bekommen den Bezirk als Suffix.
 * Ohne Namen `null`.
 */
export function kiezSlugAt(features: readonly LorFeatureLike[], index: number): string | null {
	const refs = features.map((f) => {
		const name = typeof f.properties?.BZR_NAME === 'string' ? f.properties.BZR_NAME : '';
		const bez = typeof f.properties?.BEZ === 'string' ? f.properties.BEZ.padStart(2, '0') : '';
		return { name, bezirk: BEZIRK_NAMES[bez] ?? '' };
	});
	if (!refs[index]?.name) return null;
	return buildKiezSlugs(refs)[index] ?? null;
}
