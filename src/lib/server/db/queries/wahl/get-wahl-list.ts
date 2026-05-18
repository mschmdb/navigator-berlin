import { desc, asc } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { wahl } from '../../schema/index.js';

export type WahlListItem = {
	id: number;
	jahr: number;
	typ: 'btw' | 'agh' | 'bvv';
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	isRepeatElection: boolean;
	parentElectionId: number | null;
	sourceUrl: string;
	license: string;
};

export async function getWahlList(): Promise<WahlListItem[]> {
	if (!process.env.DATABASE_URL) return [];
	const rows = await getDb()
		.select({
			id: wahl.id,
			jahr: wahl.jahr,
			typ: wahl.typ,
			stimmtyp: wahl.stimmtyp,
			isRepeatElection: wahl.isRepeatElection,
			parentElectionId: wahl.parentElectionId,
			sourceUrl: wahl.sourceUrl,
			license: wahl.license
		})
		.from(wahl)
		.orderBy(desc(wahl.jahr), asc(wahl.typ), asc(wahl.stimmtyp));
	return rows;
}
