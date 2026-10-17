import { describe, expect, it } from 'vitest';
import type { LayerAggregate, LayerAggregatesFile } from '$lib/data/layer-aggregates-types.js';
import { buildContextRows, glueShare } from './context-rows.js';

const opts = { locale: 'de' as const };

function ordinal(dominant: string): LayerAggregate {
	return {
		type: 'ordinal-distribution',
		classes: [{ label: dominant, share: 50 }],
		dominant,
		contributingMembers: 1,
		totalMembers: 1,
		coverage: '1/1'
	} as LayerAggregate;
}

function file(slug: string, berlin: LayerAggregate): LayerAggregatesFile {
	return {
		schemaVersion: 1,
		generatedAt: '2026-10-17',
		aggregates: { [slug]: { berlin, bezirk: {}, kiez: {} } }
	} as unknown as LayerAggregatesFile;
}

function berlinRow(slug: string, agg: LayerAggregate, laermDb: number | null = null) {
	const rows = buildContextRows(
		slug,
		{
			aggregates: file(slug, agg),
			kiezSlug: null,
			bezirkSlug: null,
			kiezName: null,
			bezirkName: null,
			laermDb
		},
		opts
	);
	return rows;
}

describe('buildContextRows: Stufe je Umfeld-Zeile (GH-88)', () => {
	it('Lärm „hoch“ ist danger, „gering“ success (Belastung)', () => {
		expect(berlinRow('laerm-2023', ordinal('hoch'))[0].severity).toBe('danger');
		expect(berlinRow('laerm-2023', ordinal('gering'))[0].severity).toBe('success');
		expect(berlinRow('laerm-2023', ordinal('mittel'))[0].severity).toBe('neutral');
	});

	it('Grünversorgung „gut“ ist success, „schlecht“ warning (Versorgung)', () => {
		expect(berlinRow('gruenversorgung-2023', ordinal('gut'))[0].severity).toBe('success');
		expect(berlinRow('gruenversorgung-2023', ordinal('schlecht'))[0].severity).toBe('warning');
	});

	it('Umweltgerechtigkeit: „keine starke Belastung“ success, „vierfach“ danger', () => {
		expect(
			berlinRow('umweltgerechtigkeit-2023', ordinal('keine starke Belastung'))[0].severity
		).toBe('success');
		expect(berlinRow('umweltgerechtigkeit-2023', ordinal('vierfach'))[0].severity).toBe('danger');
		expect(berlinRow('umweltgerechtigkeit-2023', ordinal('fünffach'))[0].severity).toBe('danger');
	});

	it('Wohnlage „gut“ ist success-soft (Bewertung über wol_mode)', () => {
		expect(berlinRow('wohnlagen-2024', ordinal('gut'))[0].severity).toBe('success-soft');
	});

	it('MSS bekommt keine Stufe (Stigma-Schutz)', () => {
		expect(berlinRow('mss-gesamtindex-2025', ordinal('hoch'))[0].severity).toBeUndefined();
	});

	it('Zeilen ohne Stufenwort bekommen keine Stufe', () => {
		const share = {
			type: 'area-share',
			share: 12.5,
			contributingMembers: 1,
			totalMembers: 1,
			coverage: '1/1'
		} as unknown as LayerAggregate;
		expect(berlinRow('gruenanlagen', share)[0].severity).toBeUndefined();
		const rows = berlinRow('laerm-2023', ordinal('hoch'), 56);
		expect(rows[0].id).toBe('laerm-db');
		expect(rows[0].severity).toBeUndefined();
	});
});

describe('glueShare', () => {
	it('bindet den Anteil ans Komma und das Prozentzeichen an die Zahl', () => {
		expect(glueShare('meist keine starke Belastung, 34,5 %')).toBe(
			'meist keine starke Belastung,\u00a034,5\u00a0%'
		);
	});

	it('lässt Texte ohne Anteil unverändert', () => {
		expect(glueShare('56 dB (L_DEN)')).toBe('56 dB (L_DEN)');
		expect(glueShare('meist hoch')).toBe('meist hoch');
	});

	it('akzeptiert schon geschützte Leerzeichen', () => {
		expect(glueShare('meist gut,\u00a066,7\u00a0%')).toBe('meist gut,\u00a066,7\u00a0%');
	});
});
