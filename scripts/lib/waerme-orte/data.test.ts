import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateEnrichmentSet } from './enrichment.js';
import type { WaermeEnrichment } from './types.js';

describe('committete Wärme-Orte-Daten', () => {
	it('enrichment.json besteht die Validierung ohne Fehler', () => {
		const items = JSON.parse(
			readFileSync('static/data/waerme-orte/enrichment.json', 'utf-8')
		) as WaermeEnrichment[];
		expect(validateEnrichmentSet(items)).toEqual([]);
	});

	it('jeder geeignete, bestehende Ort mit Notiz hat oh_recherche', () => {
		const items = JSON.parse(
			readFileSync('static/data/waerme-orte/enrichment.json', 'utf-8')
		) as WaermeEnrichment[];
		const missing = items
			.filter((i) => i.suitable && i.still_exists !== 'no' && i.opening_hours_note.trim())
			.filter((i) => !i.oh_recherche)
			.map((i) => i.id);
		expect(missing).toEqual([]);
	});

	it('Orte ohne Notiz tragen kein oh_recherche', () => {
		const items = JSON.parse(
			readFileSync('static/data/waerme-orte/enrichment.json', 'utf-8')
		) as WaermeEnrichment[];
		const stray = items.filter((i) => !i.opening_hours_note.trim() && i.oh_recherche);
		expect(stray.map((i) => i.id)).toEqual([]);
	});
});
