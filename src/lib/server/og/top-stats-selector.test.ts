import { describe, it, expect } from 'vitest';
import {
	selectTopStatsForBezirkOrKiez,
	formatPetValue,
	formatStopsPerKm2,
	formatLaermCategory,
	type Top3StatCard
} from './top-stats-selector.js';
import type {
	LaermAggregat,
	KlimaAggregat,
	OepnvAggregat,
	BildungAggregat,
	WohnenAggregat,
	GruenAggregat,
	LuftAggregat,
	HeritageAggregat
} from '$lib/server/db/schema/aggregate-types.js';

function makeAggregate(overrides: Partial<{
	laerm: LaermAggregat;
	klima: KlimaAggregat;
	oepnv: OepnvAggregat;
}>) {
	const emptyLaerm: LaermAggregat = { dominantCategory: null, categoryDistribution: null };
	const emptyLuft: LuftAggregat = { dominantCategory: null, categoryDistribution: null };
	const emptyGruen: GruenAggregat = {
		dominantVersorgung: null,
		versorgungDistribution: null,
		gruenanlagenCount: null,
		spielplaetzeCount: null
	};
	const emptyKlima: KlimaAggregat = { meanPet: null, shareSehrHeiss: null };
	const emptyWohnen: WohnenAggregat = {
		dominantWohnlage: null,
		wohnlageDistribution: null,
		dominantMss: null,
		mssDistribution: null
	};
	const emptyOepnv: OepnvAggregat = {
		stopsPerKm2: null,
		uBahnCount: null,
		sBahnCount: null,
		tramCount: null,
		busCount: null
	};
	const emptyBildung: BildungAggregat = { kitasPerKm2: null, schulenPerKm2: null };
	const emptyHeritage: HeritageAggregat = { denkmalPerKm2: null, stolpersteinePerKm2: null };
	return {
		laerm: overrides.laerm ?? emptyLaerm,
		luft: emptyLuft,
		gruen: emptyGruen,
		klima: overrides.klima ?? emptyKlima,
		wohnen: emptyWohnen,
		oepnv: overrides.oepnv ?? emptyOepnv,
		bildung: emptyBildung,
		heritage: emptyHeritage
	};
}

describe('formatLaermCategory', () => {
	it('capitalises common Berlin-LU-Kategorien', () => {
		expect(formatLaermCategory('hoch')).toBe('Hoch');
		expect(formatLaermCategory('mittel')).toBe('Mittel');
		expect(formatLaermCategory('niedrig')).toBe('Niedrig');
	});

	it('passes unknown values through (capitalised first char)', () => {
		expect(formatLaermCategory('sehr hoch')).toBe('Sehr hoch');
	});
});

describe('formatPetValue', () => {
	it('renders one decimal place with degree-Celsius unit', () => {
		expect(formatPetValue(32.456)).toBe('32.5 °C');
		expect(formatPetValue(28)).toBe('28.0 °C');
	});
});

describe('formatStopsPerKm2', () => {
	it('renders one decimal place with /km² unit', () => {
		expect(formatStopsPerKm2(8.234)).toBe('8.2/km²');
		expect(formatStopsPerKm2(0)).toBe('0.0/km²');
	});
});

describe('selectTopStatsForBezirkOrKiez', () => {
	it('returns exactly 3 cards in fixed order: Laerm, PET, Stationen', () => {
		const agg = makeAggregate({
			laerm: {
				dominantCategory: { value: 'hoch', layer: 'laerm-2023', sourceUpdatedAt: '2023-01-01' },
				categoryDistribution: null
			},
			klima: {
				meanPet: { value: 32.5, layer: 'klima-pet-2022', sourceUpdatedAt: '2022-08-01' },
				shareSehrHeiss: null
			},
			oepnv: {
				stopsPerKm2: { value: 8.2, layer: 'oepnv-stations', sourceUpdatedAt: '2025-01-01' },
				uBahnCount: null,
				sBahnCount: null,
				tramCount: null,
				busCount: null
			}
		});
		const result = selectTopStatsForBezirkOrKiez(agg);
		expect(result).toHaveLength(3);
		expect(result[0].label).toBe('Lärm');
		expect(result[0].value).toBe('Hoch');
		expect(result[1].label).toBe('PET');
		expect(result[1].value).toBe('32.5 °C');
		expect(result[2].label).toBe('Stationen');
		expect(result[2].value).toBe('8.2/km²');
	});

	it('renders en-dash placeholder for missing values (no em-dash, no fake data)', () => {
		const agg = makeAggregate({});
		const result = selectTopStatsForBezirkOrKiez(agg);
		expect(result).toHaveLength(3);
		const placeholderValues: Top3StatCard[] = result;
		for (const card of placeholderValues) {
			expect(card.value).toBe('–');
		}
	});

	it('preserves labels even when values are missing (skeleton card layout stable)', () => {
		const agg = makeAggregate({});
		const result = selectTopStatsForBezirkOrKiez(agg);
		expect(result.map((c) => c.label)).toEqual(['Lärm', 'PET', 'Stationen']);
	});

	it('captures source layer slug per card for attribution footer', () => {
		const agg = makeAggregate({
			klima: {
				meanPet: { value: 28, layer: 'klima-pet-2022', sourceUpdatedAt: '2022-08-01' },
				shareSehrHeiss: null
			}
		});
		const result = selectTopStatsForBezirkOrKiez(agg);
		expect(result[1].layer).toBe('klima-pet-2022');
		expect(result[0].layer).toBeNull();
	});
});
