/**
 * CLI-Aggregat-Pipeline-Types (Story 2.0 T4).
 *
 * Re-export der Schema-Aggregat-Shapes plus Container-Types für CLI-Orchestrator.
 */

import type {
	LaermAggregat,
	LuftAggregat,
	GruenAggregat,
	KlimaAggregat,
	WohnenAggregat,
	OepnvAggregat,
	BildungAggregat,
	HeritageAggregat,
	AggregateValue
} from '../../src/lib/server/db/schema/aggregate-types.js';

export type {
	LaermAggregat,
	LuftAggregat,
	GruenAggregat,
	KlimaAggregat,
	WohnenAggregat,
	OepnvAggregat,
	BildungAggregat,
	HeritageAggregat,
	AggregateValue
};

export interface BezirkAggregateRow {
	readonly slug: string;
	readonly laerm: LaermAggregat;
	readonly luft: LuftAggregat;
	readonly gruen: GruenAggregat;
	readonly klima: KlimaAggregat;
	readonly wohnen: WohnenAggregat;
	readonly oepnv: OepnvAggregat;
	readonly bildung: BildungAggregat;
	readonly heritage: HeritageAggregat;
}

export interface KiezAggregateRow extends BezirkAggregateRow {
	readonly bezirkSlug: string;
}
