export const BERLIN_BEZIRK_BY_CODE: ReadonlyMap<string, { code: string; slug: string; name: string }> =
	new Map([
		['01', { code: '01', slug: 'mitte', name: 'Mitte' }],
		['02', { code: '02', slug: 'friedrichshain-kreuzberg', name: 'Friedrichshain-Kreuzberg' }],
		['03', { code: '03', slug: 'pankow', name: 'Pankow' }],
		['04', { code: '04', slug: 'charlottenburg-wilmersdorf', name: 'Charlottenburg-Wilmersdorf' }],
		['05', { code: '05', slug: 'spandau', name: 'Spandau' }],
		['06', { code: '06', slug: 'steglitz-zehlendorf', name: 'Steglitz-Zehlendorf' }],
		['07', { code: '07', slug: 'tempelhof-schoeneberg', name: 'Tempelhof-Schöneberg' }],
		['08', { code: '08', slug: 'neukoelln', name: 'Neukölln' }],
		['09', { code: '09', slug: 'treptow-koepenick', name: 'Treptow-Köpenick' }],
		['10', { code: '10', slug: 'marzahn-hellersdorf', name: 'Marzahn-Hellersdorf' }],
		['11', { code: '11', slug: 'lichtenberg', name: 'Lichtenberg' }],
		['12', { code: '12', slug: 'reinickendorf', name: 'Reinickendorf' }]
	]);

export function bezirkSlugFromCode(code: string): string | null {
	const padded = code.padStart(2, '0');
	return BERLIN_BEZIRK_BY_CODE.get(padded)?.slug ?? null;
}
