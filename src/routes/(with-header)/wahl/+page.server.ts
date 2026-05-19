import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { buildWahlSlug } from './[slug]/slug-utils.js';
import type { PageServerLoad } from './$types';

export const prerender = true;

export type WahlIndexEntry = {
	readonly slug: string;
	readonly jahr: number;
	readonly typ: 'btw' | 'agh' | 'bvv';
	readonly stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	readonly typLabel: string;
	readonly stimmtypLabel: string;
	readonly isRepeatElection: boolean;
};

export type WahlIndexData = {
	readonly entries: ReadonlyArray<WahlIndexEntry>;
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

export const load: PageServerLoad = async (): Promise<WahlIndexData> => {
	if (!process.env.DATABASE_URL) return { entries: [] };
	const list = await getWahlList();
	const entries: WahlIndexEntry[] = list.map((w) => ({
		slug: buildWahlSlug({ jahr: w.jahr, typ: w.typ, stimmtyp: w.stimmtyp }),
		jahr: w.jahr,
		typ: w.typ,
		stimmtyp: w.stimmtyp,
		typLabel: TYP_LABELS[w.typ],
		stimmtypLabel: STIMMTYP_LABELS[w.stimmtyp],
		isRepeatElection: w.isRepeatElection
	}));
	entries.sort((a, b) => {
		if (a.jahr !== b.jahr) return b.jahr - a.jahr;
		const typOrder = { btw: 0, agh: 1, bvv: 2 } as const;
		if (a.typ !== b.typ) return typOrder[a.typ] - typOrder[b.typ];
		const stOrder = { zweitstimme: 0, erststimme: 1, einstimme: 0 } as const;
		return stOrder[a.stimmtyp] - stOrder[b.stimmtyp];
	});
	return { entries };
};
