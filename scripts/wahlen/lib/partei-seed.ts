export type ParteiSeed = {
	kurzname: string;
	vollname: string;
	farbeHex: string;
	firstSeenYear?: number;
	lastSeenYear?: number;
	aliases: readonly { label: string; jahr?: number }[];
};

export const SONSTIGE_KURZNAME = 'Sonstige';

export const PARTEI_SEED: readonly ParteiSeed[] = [
	{
		kurzname: 'SPD',
		vollname: 'Sozialdemokratische Partei Deutschlands',
		farbeHex: '#E3000F',
		aliases: [{ label: 'SPD' }]
	},
	{
		kurzname: 'CDU',
		vollname: 'Christlich Demokratische Union Deutschlands',
		farbeHex: '#000000',
		aliases: [{ label: 'CDU' }]
	},
	{
		kurzname: 'CSU',
		vollname: 'Christlich-Soziale Union in Bayern',
		farbeHex: '#008AC5',
		aliases: [{ label: 'CSU' }]
	},
	{
		kurzname: 'GRÜNE',
		vollname: 'Bündnis 90/Die Grünen',
		farbeHex: '#1AA037',
		aliases: [
			{ label: 'GRÜNE' },
			{ label: "B'90/GRÜNE" },
			{ label: 'Bündnis 90/Die Grünen' },
			{ label: 'Die Grünen' }
		]
	},
	{
		kurzname: 'FDP',
		vollname: 'Freie Demokratische Partei',
		farbeHex: '#FFEF00',
		aliases: [{ label: 'FDP' }]
	},
	{
		kurzname: 'AfD',
		vollname: 'Alternative für Deutschland',
		farbeHex: '#009EE0',
		firstSeenYear: 2013,
		aliases: [{ label: 'AfD' }]
	},
	{
		kurzname: 'Die Linke',
		vollname: 'Die Linke',
		farbeHex: '#BE3075',
		aliases: [
			{ label: 'Die Linke' },
			{ label: 'DIE LINKE' },
			{ label: 'Linkspartei.PDS' },
			{ label: 'PDS' },
			{ label: 'Linke' }
		]
	},
	{
		kurzname: 'BSW',
		vollname: 'Bündnis Sahra Wagenknecht',
		farbeHex: '#722282',
		firstSeenYear: 2024,
		aliases: [{ label: 'BSW' }]
	},
	{
		kurzname: 'FREIE WÄHLER',
		vollname: 'FREIE WÄHLER',
		farbeHex: '#FF8C00',
		aliases: [{ label: 'FREIE WÄHLER' }]
	},
	{
		kurzname: SONSTIGE_KURZNAME,
		vollname: 'Sonstige Parteien (zusammengefasst)',
		farbeHex: '#888888',
		aliases: [{ label: 'Sonstige' }, { label: 'Übrige' }, { label: 'übrige' }]
	}
] as const;

export function buildAliasIndex(seed: readonly ParteiSeed[] = PARTEI_SEED): Map<string, string> {
	const index = new Map<string, string>();
	for (const p of seed) {
		for (const a of p.aliases) {
			index.set(a.label.toLowerCase(), p.kurzname);
		}
	}
	return index;
}

export function resolveParteiKurzname(
	label: string,
	index: Map<string, string> = buildAliasIndex()
): string {
	const key = label.trim().toLowerCase();
	return index.get(key) ?? SONSTIGE_KURZNAME;
}
