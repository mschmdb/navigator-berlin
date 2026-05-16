import { describe, it, expect, afterAll } from 'vitest';
import { closeDb } from '../index.js';
import { getBezirkStats } from './get-bezirk-stats.js';
import { getKiezStats } from './get-kiez-stats.js';
import { getBezirkScore } from './get-bezirk-score.js';
import { getKiezScore } from './get-kiez-score.js';
import { getFaqQna } from './get-faq-qna.js';

/**
 * Snapshot-Tests (Story 2.0 AC-5 + AC-7-A5).
 *
 * Voraussetzung: `pnpm db:migrate && pnpm data:aggregate` lokal gelaufen.
 * Tests gegen echte lokale Postgres weil pg-mem die JSONB-Drizzle-Inference
 * nicht zuverlässig modelliert. CI-Postgres-Service kommt mit Story 4.3.
 */

afterAll(async () => {
	await closeDb();
});

describe('getBezirkStats (snapshot)', () => {
	it('returns non-null data for friedrichshain-kreuzberg with provenance', async () => {
		const row = await getBezirkStats('friedrichshain-kreuzberg');
		expect(row).not.toBeNull();
		expect(row?.slug).toBe('friedrichshain-kreuzberg');
		// Provenance smoke: jeder non-null Aggregat-Wert hat layer + sourceUpdatedAt
		expect(row?.oepnv.stopsPerKm2).not.toBeNull();
		expect(row?.oepnv.stopsPerKm2?.layer).toBe('oepnv-composite');
		expect(row?.oepnv.stopsPerKm2?.sourceUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
		expect(row?.heritage.denkmalPerKm2?.layer).toBe('denkmal-2024');
	});

	it('returns null for unknown bezirk slug', async () => {
		const row = await getBezirkStats('does-not-exist');
		expect(row).toBeNull();
	});

	it('mitte has populated cluster fields', async () => {
		const row = await getBezirkStats('mitte');
		expect(row).not.toBeNull();
		expect(row?.bildung.kitasPerKm2?.value).toBeGreaterThan(0);
		expect(row?.bildung.schulenPerKm2?.value).toBeGreaterThan(0);
	});
});

describe('getKiezStats (snapshot)', () => {
	it('returns data for a known LOR-bezirksregion (Boxhagener Kiez expects "boxhagener-kiez" or similar)', async () => {
		// Boxhagener-Kiez ist BZR_NAME in F-K. Slug = normalizeSlug("Boxhagener Platz")
		// oder ähnlich, abhängig vom realen BZR_NAME im ODIS-Dataset.
		// Wir nehmen statt dessen einen anderen bekannten Slug aus dem 143er-Set:
		// "tiergarten-sued" existiert garantiert nicht 1:1; nutze ersten Kiez aus DB.
		const someKiez = await import('./get-kiez-stats.js').then(async (m) => {
			const { getDb } = await import('../index.js');
			const { kiezStats } = await import('../schema/index.js');
			const rows = await getDb().select().from(kiezStats).limit(1);
			return rows[0] ? m.getKiezStats(rows[0].slug) : null;
		});
		expect(someKiez).not.toBeNull();
		expect(someKiez?.bezirkSlug).toMatch(/^[a-z-]+$/);
	});

	it('returns null for unknown kiez slug', async () => {
		const row = await getKiezStats('does-not-exist-kiez');
		expect(row).toBeNull();
	});
});

describe('getBezirkScore / getKiezScore (null-fallback)', () => {
	it('getBezirkScore returns null for any slug (table empty in Story 2.0)', async () => {
		const row = await getBezirkScore('mitte');
		expect(row).toBeNull();
	});

	it('getKiezScore returns null for any slug (table empty in Story 2.0)', async () => {
		const row = await getKiezScore('any-kiez');
		expect(row).toBeNull();
	});
});

describe('getFaqQna (empty-array fallback)', () => {
	it('returns empty array for bezirk (table empty in Story 2.0)', async () => {
		const rows = await getFaqQna({ pageType: 'bezirk', slug: 'mitte', locale: 'de' });
		expect(rows).toEqual([]);
	});

	it('returns empty array for kiez en', async () => {
		const rows = await getFaqQna({ pageType: 'kiez', slug: 'any', locale: 'en' });
		expect(rows).toEqual([]);
	});
});
