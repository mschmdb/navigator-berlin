import { error } from '@sveltejs/kit';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { getResultsForBerlin } from '$lib/server/db/queries/wahl/get-results-for-berlin.js';
import { getResultsForBezirk } from '$lib/server/db/queries/wahl/get-results-for-bezirk.js';
import { getStimmbezirksWinners } from '$lib/server/db/queries/wahl/get-stimmbezirks-winners.js';
import { WAHL_TO_GEO } from '$lib/data/wahl-geo-mapping.js';
import { parseWahlSlug, buildWahlSlug, type WahlSlug } from './slug-utils.js';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

const BEZIRK_SLUGS = [
	'mitte',
	'friedrichshain-kreuzberg',
	'pankow',
	'charlottenburg-wilmersdorf',
	'spandau',
	'steglitz-zehlendorf',
	'tempelhof-schoeneberg',
	'neukoelln',
	'treptow-koepenick',
	'marzahn-hellersdorf',
	'lichtenberg',
	'reinickendorf'
] as const;

const BEZIRK_NAMES: Record<(typeof BEZIRK_SLUGS)[number], string> = {
	mitte: 'Mitte',
	'friedrichshain-kreuzberg': 'Friedrichshain-Kreuzberg',
	pankow: 'Pankow',
	'charlottenburg-wilmersdorf': 'Charlottenburg-Wilmersdorf',
	spandau: 'Spandau',
	'steglitz-zehlendorf': 'Steglitz-Zehlendorf',
	'tempelhof-schoeneberg': 'Tempelhof-Schöneberg',
	neukoelln: 'Neukölln',
	'treptow-koepenick': 'Treptow-Köpenick',
	'marzahn-hellersdorf': 'Marzahn-Hellersdorf',
	lichtenberg: 'Lichtenberg',
	reinickendorf: 'Reinickendorf'
};

const TYP_LABELS = {
	btw: 'Bundestagswahl',
	agh: 'Abgeordnetenhauswahl',
	bvv: 'BVV-Wahl'
} as const;

const STIMMTYP_LABELS = {
	erststimme: 'Erststimme',
	zweitstimme: 'Zweitstimme',
	einstimme: 'Stimme'
} as const;

export const entries: EntryGenerator = async () => {
	if (!process.env.DATABASE_URL) {
		// Build ohne DB: deterministische Fallback-Liste der 20 wahl-Rows
		const fallback: WahlSlug[] = [];
		for (const jahr of [2013, 2017, 2021, 2025]) {
			fallback.push({ jahr, typ: 'btw', stimmtyp: 'erststimme' });
			fallback.push({ jahr, typ: 'btw', stimmtyp: 'zweitstimme' });
		}
		for (const jahr of [2011, 2016, 2021, 2023]) {
			fallback.push({ jahr, typ: 'agh', stimmtyp: 'erststimme' });
			fallback.push({ jahr, typ: 'agh', stimmtyp: 'zweitstimme' });
			fallback.push({ jahr, typ: 'bvv', stimmtyp: 'einstimme' });
		}
		return fallback.map((s) => ({ slug: buildWahlSlug(s) }));
	}
	const list = await getWahlList();
	return list.map((w) => ({
		slug: buildWahlSlug({ jahr: w.jahr, typ: w.typ, stimmtyp: w.stimmtyp })
	}));
};

export type WahlDetailPageData = {
	readonly slug: string;
	readonly wahl: {
		readonly id: number;
		readonly jahr: number;
		readonly typ: 'btw' | 'agh' | 'bvv';
		readonly stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
		readonly typLabel: string;
		readonly stimmtypLabel: string;
		readonly title: string;
		readonly isRepeatElection: boolean;
		readonly parentSlug: string | null;
		readonly sourceUrl: string;
		readonly sourceName: string;
		readonly license: string;
	};
	readonly berlin: ReadonlyArray<{
		readonly kurzname: string;
		readonly vollname: string;
		readonly farbeHex: string;
		readonly stimmen: number;
		readonly anteil: number;
	}>;
	readonly bezirke: ReadonlyArray<{
		readonly slug: string;
		readonly name: string;
		readonly top3: ReadonlyArray<{
			readonly kurzname: string;
			readonly vollname: string;
			readonly farbeHex: string;
			readonly stimmen: number;
			readonly anteil: number;
		}>;
	}>;
	/** Story 6.4c: Geo-Layer-Slug für Stimmbezirks-Choropleth oder null. */
	readonly geoSlug: string | null;
	/** Story 6.4c: Top-1 pro UWB für Stimmbezirks-Choropleth, leer wenn keine Geometrie. */
	readonly winnersByUwb: ReadonlyArray<{
		readonly uwbId: string;
		readonly parteiKurzname: string;
		readonly farbeHex: string;
		readonly anteil: number;
	}>;
};

export const load: PageServerLoad = async ({ params }) => {
	const parsed = parseWahlSlug(params.slug);
	if (!parsed) {
		throw error(404, `Unbekanntes Wahl-Slug: ${params.slug}`);
	}

	if (!process.env.DATABASE_URL) {
		throw error(503, 'Wahldaten-Datenbank nicht verfügbar.');
	}

	const list = await getWahlList();
	const match = list.find(
		(w) => w.jahr === parsed.jahr && w.typ === parsed.typ && w.stimmtyp === parsed.stimmtyp
	);
	if (!match) {
		throw error(404, `Wahl ${params.slug} existiert nicht in der Datenbank.`);
	}

	const wahlSlugShort = `${match.typ}${String(match.jahr).slice(-2)}`;
	const geoSlug = WAHL_TO_GEO.get(wahlSlugShort) ?? null;

	const [berlinRows, bezirkRowsList, winners] = await Promise.all([
		getResultsForBerlin(match.id, 10),
		Promise.all(BEZIRK_SLUGS.map((slug) => getResultsForBezirk(match.id, slug, 3))),
		geoSlug ? getStimmbezirksWinners(match.id) : Promise.resolve([])
	]);

	const parentSlug =
		match.isRepeatElection && match.parentElectionId
			? buildWahlSlugFromParentId(match.parentElectionId, list)
			: null;

	const sourceName = match.sourceUrl.includes('bundeswahlleiterin')
		? 'Bundeswahlleiterin'
		: 'Amt für Statistik Berlin-Brandenburg';

	const title = `${TYP_LABELS[match.typ]} ${match.jahr}${
		match.typ !== 'bvv' ? ` · ${STIMMTYP_LABELS[match.stimmtyp]}` : ''
	}${match.isRepeatElection ? ' · Wiederholungswahl' : ''}`;

	const data: WahlDetailPageData = {
		slug: params.slug,
		wahl: {
			id: match.id,
			jahr: match.jahr,
			typ: match.typ,
			stimmtyp: match.stimmtyp,
			typLabel: TYP_LABELS[match.typ],
			stimmtypLabel: STIMMTYP_LABELS[match.stimmtyp],
			title,
			isRepeatElection: match.isRepeatElection,
			parentSlug,
			sourceUrl: match.sourceUrl,
			sourceName,
			license: match.license
		},
		berlin: berlinRows.map((r) => ({
			kurzname: r.parteiKurzname,
			vollname: r.parteiVollname,
			farbeHex: r.farbeHex,
			stimmen: r.stimmen,
			anteil: r.anteil
		})),
		bezirke: BEZIRK_SLUGS.map((slug, i) => ({
			slug,
			name: BEZIRK_NAMES[slug],
			top3: bezirkRowsList[i].map((r) => ({
				kurzname: r.parteiKurzname,
				vollname: r.parteiVollname,
				farbeHex: r.farbeHex,
				stimmen: r.stimmen,
				anteil: r.anteil
			}))
		})),
		geoSlug,
		winnersByUwb: winners.map((w) => ({
			uwbId: w.uwbId,
			parteiKurzname: w.parteiKurzname,
			farbeHex: w.farbeHex,
			anteil: w.anteil
		}))
	};

	return data;
};

function buildWahlSlugFromParentId(
	parentId: number,
	list: ReadonlyArray<{
		id: number;
		jahr: number;
		typ: 'btw' | 'agh' | 'bvv';
		stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	}>
): string | null {
	const parent = list.find((w) => w.id === parentId);
	if (!parent) return null;
	return buildWahlSlug({ jahr: parent.jahr, typ: parent.typ, stimmtyp: parent.stimmtyp });
}
