import { eq, and, sql } from 'drizzle-orm';
import type { Db } from '../../../src/lib/server/db/index.js';
import {
	wahl,
	stimmbezirk,
	partei,
	parteiAlias,
	ergebnis,
	wahlAggregatBezirk,
	wahlAggregatBerlin
} from '../../../src/lib/server/db/schema/index.js';
import { PARTEI_SEED } from './partei-seed.js';
import type { TransformedBwlRow, StimmtypKey } from './row-transformer.js';
import { bezirkSlugFromCode } from './bezirk-codes.js';

const INSERT_CHUNK = 1000;

export type ParteiIdMap = ReadonlyMap<string, number>;

export async function seedParteienAndAliases(db: Db): Promise<ParteiIdMap> {
	for (const p of PARTEI_SEED) {
		await db
			.insert(partei)
			.values({
				kurzname: p.kurzname,
				vollname: p.vollname,
				farbeHex: p.farbeHex,
				firstSeenYear: p.firstSeenYear ?? null,
				lastSeenYear: p.lastSeenYear ?? null
			})
			.onConflictDoUpdate({
				target: partei.kurzname,
				set: {
					vollname: p.vollname,
					farbeHex: p.farbeHex,
					firstSeenYear: p.firstSeenYear ?? null,
					lastSeenYear: p.lastSeenYear ?? null
				}
			});
	}

	const rows = await db.select({ id: partei.id, kurzname: partei.kurzname }).from(partei);
	const idByKurzname = new Map<string, number>();
	for (const r of rows) idByKurzname.set(r.kurzname, r.id);

	for (const p of PARTEI_SEED) {
		const parteiId = idByKurzname.get(p.kurzname);
		if (!parteiId) continue;
		for (const alias of p.aliases) {
			await db
				.insert(parteiAlias)
				.values({
					parteiId,
					aliasLabel: alias.label,
					jahr: alias.jahr ?? null
				})
				.onConflictDoNothing();
		}
	}

	return idByKurzname;
}

export type UpsertWahlParams = {
	jahr: number;
	typ: 'btw' | 'agh' | 'bvv';
	stimmtyp: StimmtypKey | 'einstimme';
	sourceUrl: string;
	license: string;
	sourceUpdatedAt?: Date;
	isRepeatElection?: boolean;
	parentElectionId?: number;
};

export async function upsertWahl(db: Db, params: UpsertWahlParams): Promise<number> {
	const existing = await db
		.select({ id: wahl.id })
		.from(wahl)
		.where(
			and(
				eq(wahl.jahr, params.jahr),
				eq(wahl.typ, params.typ),
				eq(wahl.stimmtyp, params.stimmtyp)
			)
		)
		.limit(1);

	if (existing.length > 0) {
		const id = existing[0].id;
		await db
			.update(wahl)
			.set({
				sourceUrl: params.sourceUrl,
				license: params.license,
				sourceUpdatedAt: params.sourceUpdatedAt ?? null,
				isRepeatElection: params.isRepeatElection ?? false,
				parentElectionId: params.parentElectionId ?? null,
				computedAt: new Date()
			})
			.where(eq(wahl.id, id));
		return id;
	}

	const [inserted] = await db
		.insert(wahl)
		.values({
			jahr: params.jahr,
			typ: params.typ,
			stimmtyp: params.stimmtyp,
			sourceUrl: params.sourceUrl,
			license: params.license,
			sourceUpdatedAt: params.sourceUpdatedAt ?? null,
			isRepeatElection: params.isRepeatElection ?? false,
			parentElectionId: params.parentElectionId ?? null
		})
		.returning({ id: wahl.id });

	return inserted.id;
}

export async function clearWahlData(db: Db, wahlId: number): Promise<void> {
	await db.delete(ergebnis).where(eq(ergebnis.wahlId, wahlId));
	await db.delete(stimmbezirk).where(eq(stimmbezirk.wahlId, wahlId));
	await db.delete(wahlAggregatBezirk).where(eq(wahlAggregatBezirk.wahlId, wahlId));
	await db.delete(wahlAggregatBerlin).where(eq(wahlAggregatBerlin.wahlId, wahlId));
}

export async function insertStimmbezirke(
	db: Db,
	wahlId: number,
	rows: readonly TransformedBwlRow[]
): Promise<number> {
	const seen = new Set<string>();
	const values = rows
		.filter((r) => {
			if (seen.has(r.uwbId)) return false;
			seen.add(r.uwbId);
			return true;
		})
		.map((r) => ({
			wahlId,
			uwbId: r.uwbId,
			wahlkreis: r.wahlkreis,
			wahlbezirk: r.wahlbezirk,
			bezirkCode: r.bezirkCode,
			bezirksart: r.bezirksart || null
		}));

	let inserted = 0;
	for (let i = 0; i < values.length; i += INSERT_CHUNK) {
		const chunk = values.slice(i, i + INSERT_CHUNK);
		await db.insert(stimmbezirk).values(chunk).onConflictDoNothing();
		inserted += chunk.length;
	}
	return inserted;
}

export async function insertErgebnisse(
	db: Db,
	wahlId: number,
	rows: readonly TransformedBwlRow[],
	stimmtyp: StimmtypKey | 'einstimme',
	parteiIdByKurzname: ParteiIdMap
): Promise<number> {
	const slot: 'erststimme' | 'zweitstimme' = stimmtyp === 'zweitstimme' ? 'zweitstimme' : 'erststimme';

	const values: {
		wahlId: number;
		uwbId: string;
		parteiId: number;
		stimmen: number;
		anteil: number;
		istBriefwahlAggregat: boolean;
	}[] = [];

	for (const r of rows) {
		const gueltig = r.gueltig[slot];
		const votes = r.votes[slot];
		if (votes.length === 0) continue;
		const seen = new Set<number>();
		for (const v of votes) {
			const parteiId = parteiIdByKurzname.get(v.parteiKurzname);
			if (!parteiId || seen.has(parteiId)) continue;
			seen.add(parteiId);
			values.push({
				wahlId,
				uwbId: r.uwbId,
				parteiId,
				stimmen: v.stimmen,
				anteil: gueltig > 0 ? v.stimmen / gueltig : 0,
				istBriefwahlAggregat: r.istBriefwahl
			});
		}
	}

	let inserted = 0;
	for (let i = 0; i < values.length; i += INSERT_CHUNK) {
		const chunk = values.slice(i, i + INSERT_CHUNK);
		await db.insert(ergebnis).values(chunk).onConflictDoNothing();
		inserted += chunk.length;
	}
	return inserted;
}

export type AggregatCounts = {
	berlin: number;
	bezirk: number;
};

export async function buildAggregates(db: Db, wahlId: number): Promise<AggregatCounts> {
	const bezirkResult = await db.execute(sql`
		INSERT INTO wahl_aggregat_bezirk (wahl_id, bezirk_slug, partei_id, stimmen, anteil, computed_at)
		SELECT
			e.wahl_id,
			CASE s.bezirk_code
				WHEN '01' THEN 'mitte'
				WHEN '02' THEN 'friedrichshain-kreuzberg'
				WHEN '03' THEN 'pankow'
				WHEN '04' THEN 'charlottenburg-wilmersdorf'
				WHEN '05' THEN 'spandau'
				WHEN '06' THEN 'steglitz-zehlendorf'
				WHEN '07' THEN 'tempelhof-schoeneberg'
				WHEN '08' THEN 'neukoelln'
				WHEN '09' THEN 'treptow-koepenick'
				WHEN '10' THEN 'marzahn-hellersdorf'
				WHEN '11' THEN 'lichtenberg'
				WHEN '12' THEN 'reinickendorf'
				ELSE NULL
			END AS bezirk_slug,
			e.partei_id,
			SUM(e.stimmen)::int AS stimmen,
			(SUM(e.stimmen)::float / NULLIF(SUM(SUM(e.stimmen)) OVER (PARTITION BY e.wahl_id, s.bezirk_code), 0))::real AS anteil,
			now() AS computed_at
		FROM ergebnis e
		JOIN stimmbezirk s ON s.wahl_id = e.wahl_id AND s.uwb_id = e.uwb_id
		WHERE e.wahl_id = ${wahlId}
		GROUP BY e.wahl_id, s.bezirk_code, e.partei_id
		HAVING CASE s.bezirk_code
			WHEN '01' THEN 'mitte'
			WHEN '02' THEN 'friedrichshain-kreuzberg'
			WHEN '03' THEN 'pankow'
			WHEN '04' THEN 'charlottenburg-wilmersdorf'
			WHEN '05' THEN 'spandau'
			WHEN '06' THEN 'steglitz-zehlendorf'
			WHEN '07' THEN 'tempelhof-schoeneberg'
			WHEN '08' THEN 'neukoelln'
			WHEN '09' THEN 'treptow-koepenick'
			WHEN '10' THEN 'marzahn-hellersdorf'
			WHEN '11' THEN 'lichtenberg'
			WHEN '12' THEN 'reinickendorf'
			ELSE NULL
		END IS NOT NULL
	`);

	const berlinResult = await db.execute(sql`
		INSERT INTO wahl_aggregat_berlin (wahl_id, partei_id, stimmen, anteil, computed_at)
		SELECT
			wahl_id,
			partei_id,
			SUM(stimmen)::int AS stimmen,
			(SUM(stimmen)::float / NULLIF(SUM(SUM(stimmen)) OVER (PARTITION BY wahl_id), 0))::real AS anteil,
			now() AS computed_at
		FROM ergebnis
		WHERE wahl_id = ${wahlId}
		GROUP BY wahl_id, partei_id
	`);

	const bezirkRows = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(wahlAggregatBezirk)
		.where(eq(wahlAggregatBezirk.wahlId, wahlId));

	const berlinRows = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(wahlAggregatBerlin)
		.where(eq(wahlAggregatBerlin.wahlId, wahlId));

	return {
		bezirk: bezirkRows[0]?.count ?? 0,
		berlin: berlinRows[0]?.count ?? 0
	};
}

export { bezirkSlugFromCode };
