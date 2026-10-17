import { describe, expect, it } from 'vitest';
import {
	buildResearchBatches,
	mergeEnrichmentResults,
	validateEnrichment,
	validateEnrichmentSet,
	type CandidatePlace,
	type PriorKuehleEntry
} from './enrichment.js';
import type { WaermeEnrichment } from './types.js';

function item(over: Partial<WaermeEnrichment> = {}): WaermeEnrichment {
	return {
		id: 'node/1',
		name: 'Bibliothek X',
		cat: 'Bibliothek',
		suitable: true,
		suitable_reason: 'Öffentlich zugänglich, Betreiberseite nennt Winteröffnung.',
		winter_open: 'yes',
		opening_hours_note: 'Mo-Fr 10-18 Uhr',
		stay_without_purchase: 'yes',
		is_free: 'free',
		website: 'https://betreiber.example/',
		source_url: 'https://betreiber.example/oeffnungszeiten',
		checked_at: '2026-10-16',
		still_exists: 'yes',
		notes: '',
		...over
	};
}

function place(id: string, name = 'Ort'): CandidatePlace {
	return {
		id,
		cat: 'Bibliothek',
		name,
		lat: 52.5,
		lon: 13.4,
		addr: 'Teststr 1',
		plz: '10117',
		oh: 'Mo-Fr 10:00-18:00',
		wheelchair: '',
		website: '',
		tags: { amenity: 'library' }
	};
}

describe('validateEnrichment oh_recherche', () => {
	it('akzeptiert fehlendes Feld, gültige OSM-Syntax und "unklar"', () => {
		expect(validateEnrichment(item())).toEqual([]);
		expect(validateEnrichment(item({ oh_recherche: 'Sa 11:00-13:00; PH off' }))).toEqual([]);
		expect(validateEnrichment(item({ oh_recherche: 'unklar' }))).toEqual([]);
	});

	it('lehnt nicht parsbare Werte ab', () => {
		expect(validateEnrichment(item({ oh_recherche: 'nach dem Gottesdienst' }))).toContainEqual(
			expect.stringMatching(/oh_recherche/)
		);
		expect(validateEnrichment(item({ oh_recherche: '' }))).toContainEqual(
			expect.stringMatching(/oh_recherche/)
		);
	});

	it('lehnt Werte mit Parser-Warnung ab', () => {
		expect(validateEnrichment(item({ oh_recherche: 'Mo PH 10:00-18:00' }))).toContainEqual(
			expect.stringMatching(/oh_recherche/)
		);
	});

	it('verlangt eine Notiz', () => {
		const errors = validateEnrichment(
			item({ oh_recherche: 'Sa 11:00-13:00', opening_hours_note: '' })
		);
		expect(errors).toContainEqual(expect.stringMatching(/oh_recherche ohne opening_hours_note/));
	});

	it('lehnt Nicht-Strings ab', () => {
		const bad = item({ oh_recherche: 5 as unknown as string });
		expect(validateEnrichment(bad)).toContainEqual(expect.stringMatching(/oh_recherche/));
	});
});

describe('validateEnrichment', () => {
	it('akzeptiert einen vollständigen Eintrag', () => {
		expect(validateEnrichment(item())).toEqual([]);
	});

	it('verlangt source_url, sobald eine Angabe nicht unknown ist', () => {
		expect(validateEnrichment(item({ source_url: '' }))).toContainEqual(
			expect.stringMatching(/source_url/)
		);
	});

	it('erlaubt fehlende Quelle, wenn alle Angaben unknown sind und suitable=false', () => {
		const errors = validateEnrichment(
			item({
				suitable: false,
				source_url: '',
				winter_open: 'unknown',
				stay_without_purchase: 'unknown',
				is_free: 'unknown',
				opening_hours_note: ''
			})
		);
		expect(errors).toEqual([]);
	});

	it('verlangt ein Prüfdatum im ISO-Format', () => {
		expect(validateEnrichment(item({ checked_at: '' }))).toContainEqual(
			expect.stringMatching(/checked_at/)
		);
		expect(validateEnrichment(item({ checked_at: '16.10.2026' }))).toContainEqual(
			expect.stringMatching(/checked_at/)
		);
	});

	it('lehnt Werte außerhalb der Enums ab', () => {
		const bad = item({ winter_open: 'ja' as WaermeEnrichment['winter_open'] });
		expect(validateEnrichment(bad)).toContainEqual(expect.stringMatching(/winter_open/));
	});

	it('verlangt eine Begründung und http(s)-URLs', () => {
		expect(validateEnrichment(item({ suitable_reason: '' }))).toContainEqual(
			expect.stringMatching(/suitable_reason/)
		);
		expect(validateEnrichment(item({ source_url: 'javascript:alert(1)' }))).toContainEqual(
			expect.stringMatching(/source_url/)
		);
		expect(validateEnrichment(item({ website: 'ftp://x' }))).toContainEqual(
			expect.stringMatching(/website/)
		);
	});

	it('verlangt eine id der Form node|way|relation/Zahl', () => {
		expect(validateEnrichment(item({ id: 'foo' }))).toContainEqual(expect.stringMatching(/id/));
	});
});

describe('buildResearchBatches', () => {
	const prior: Record<string, PriorKuehleEntry> = {
		'node/1': {
			is_free: 'free',
			website: 'https://kuehle.example/',
			address_verified: 'Teststr 1, 10117 Berlin',
			still_exists: 'yes'
		}
	};

	it('teilt offene Orte in Batches der gewünschten Größe', () => {
		const places = ['node/1', 'node/2', 'node/3'].map((id) => place(id));
		const batches = buildResearchBatches(places, [], prior, 2);
		expect(batches.map((b) => b.tasks.length)).toEqual([2, 1]);
		expect(batches[0].batch).toBe(1);
	});

	it('überspringt Orte, die schon ein Enrichment haben', () => {
		const places = ['node/1', 'node/2'].map((id) => place(id));
		const batches = buildResearchBatches(places, [item({ id: 'node/1' })], prior, 10);
		expect(batches[0].tasks.map((t) => t.id)).toEqual(['node/2']);
	});

	it('gibt die Kühle-Orte-Recherche als Ausgangspunkt mit', () => {
		const batches = buildResearchBatches([place('node/1')], [], prior, 10);
		expect(batches[0].tasks[0].prior).toEqual(prior['node/1']);
		expect(buildResearchBatches([place('node/2')], [], prior, 10)[0].tasks[0].prior).toBeNull();
	});

	it('sortiert deterministisch nach id', () => {
		const batches = buildResearchBatches([place('node/2'), place('node/1')], [], {}, 10);
		expect(batches[0].tasks.map((t) => t.id)).toEqual(['node/1', 'node/2']);
	});
});

describe('mergeEnrichmentResults oh_recherche', () => {
	const ids = ['node/1'];

	it('übernimmt oh_recherche, wenn die Notiz gleich bleibt', () => {
		const existing = [item({ oh_recherche: 'Mo-Fr 10:00-18:00' })];
		const { merged, errors } = mergeEnrichmentResults(
			existing,
			[item({ checked_at: '2026-10-17' })],
			ids
		);
		expect(errors).toEqual([]);
		expect(merged[0].oh_recherche).toBe('Mo-Fr 10:00-18:00');
		expect(merged[0].checked_at).toBe('2026-10-17');
	});

	it('verwirft oh_recherche, wenn sich die Notiz ändert', () => {
		const existing = [item({ oh_recherche: 'Mo-Fr 10:00-18:00' })];
		const { merged } = mergeEnrichmentResults(
			existing,
			[item({ opening_hours_note: 'Mo-Fr 11-18 Uhr' })],
			ids
		);
		expect(merged[0].oh_recherche).toBeUndefined();
	});
});

describe('mergeEnrichmentResults', () => {
	it('fügt neue Ergebnisse an und sortiert nach id', () => {
		const res = mergeEnrichmentResults(
			[item({ id: 'node/2' })],
			[item({ id: 'node/1' })],
			['node/1', 'node/2']
		);
		expect(res.errors).toEqual([]);
		expect(res.merged.map((e) => e.id)).toEqual(['node/1', 'node/2']);
	});

	it('meldet ungültige Einträge und übernimmt sie nicht', () => {
		const res = mergeEnrichmentResults([], [item({ id: 'node/1', checked_at: '' })], ['node/1']);
		expect(res.merged).toEqual([]);
		expect(res.errors[0]).toMatch(/node\/1/);
	});

	it('weist ids ab, die keine Kandidaten sind', () => {
		const res = mergeEnrichmentResults([], [item({ id: 'node/9' })], ['node/1']);
		expect(res.merged).toEqual([]);
		expect(res.errors[0]).toMatch(/node\/9/);
	});

	it('ersetzt einen vorhandenen Eintrag derselben id', () => {
		const res = mergeEnrichmentResults(
			[item({ id: 'node/1', notes: 'alt' })],
			[item({ id: 'node/1', notes: 'neu' })],
			['node/1']
		);
		expect(res.merged).toHaveLength(1);
		expect(res.merged[0].notes).toBe('neu');
	});

	it('meldet doppelte ids innerhalb der Ergebnisse', () => {
		const res = mergeEnrichmentResults(
			[],
			[item({ id: 'node/1' }), item({ id: 'node/1' })],
			['node/1']
		);
		expect(res.errors.some((e) => /doppelt/.test(e))).toBe(true);
	});
});

describe('validateEnrichment: Methodik-Regeln', () => {
	it('verlangt source_url auch bei suitable=true ohne weitere Angaben', () => {
		const errors = validateEnrichment(
			item({
				source_url: '',
				winter_open: 'unknown',
				stay_without_purchase: 'unknown',
				is_free: 'unknown',
				opening_hours_note: ''
			})
		);
		expect(errors).toContainEqual(expect.stringMatching(/source_url/));
	});

	it('lehnt suitable=true mit winter_open=no ab', () => {
		expect(validateEnrichment(item({ winter_open: 'no' }))).toContainEqual(
			expect.stringMatching(/winter_open/)
		);
		expect(validateEnrichment(item({ winter_open: 'no', suitable: false }))).toEqual([]);
	});

	it('lehnt suitable=true mit is_free=ticket ab', () => {
		expect(validateEnrichment(item({ is_free: 'ticket' }))).toContainEqual(
			expect.stringMatching(/is_free/)
		);
		expect(validateEnrichment(item({ is_free: 'ticket', suitable: false }))).toEqual([]);
	});

	it('lehnt suitable=true mit Platzhalter-Namen ab', () => {
		const name = 'Kirche (ohne Namen in OSM)';
		expect(validateEnrichment(item({ name }))).toContainEqual(expect.stringMatching(/name/));
		expect(validateEnrichment(item({ name, suitable: false }))).toEqual([]);
	});

	it('meldet Nicht-Strings als Fehler statt TypeError', () => {
		for (const field of [
			'notes',
			'website',
			'source_url',
			'opening_hours_note',
			'suitable_reason',
			'name'
		] as const) {
			const bad = { ...item(), [field]: 42 } as unknown as WaermeEnrichment;
			expect(validateEnrichment(bad)).toContainEqual(expect.stringMatching(new RegExp(field)));
		}
	});

	it('verlangt ein echtes Kalenderdatum', () => {
		expect(validateEnrichment(item({ checked_at: '2026-02-30' }))).toContainEqual(
			expect.stringMatching(/checked_at/)
		);
		expect(validateEnrichment(item({ checked_at: '2026-13-01' }))).toContainEqual(
			expect.stringMatching(/checked_at/)
		);
		expect(validateEnrichment(item({ checked_at: '2028-02-29' }))).toEqual([]);
	});
});

describe('buildResearchBatches: Batchgröße', () => {
	it('verlangt eine positive Ganzzahl', () => {
		for (const size of [0, -1, Number.NaN, 1.5]) {
			expect(() => buildResearchBatches([place('node/1')], [], {}, size)).toThrow(/batchSize/);
		}
	});
});

describe('validateEnrichmentSet', () => {
	it('meldet doppelte ids und Einzelfehler mit id', () => {
		const errors = validateEnrichmentSet([
			item({ id: 'node/1' }),
			item({ id: 'node/1' }),
			item({ id: 'node/2', checked_at: '' })
		]);
		expect(errors.some((e) => /node\/1: id doppelt/.test(e))).toBe(true);
		expect(errors.some((e) => /node\/2: checked_at/.test(e))).toBe(true);
	});

	it('liefert nichts bei gültigen Einträgen', () => {
		expect(validateEnrichmentSet([item({ id: 'node/1' }), item({ id: 'node/2' })])).toEqual([]);
	});
});
