import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock('$lib/server/db/index.js', () => ({
	getDb: () => ({ select: () => ({ from: fromMock }) })
}));

const { getKiezNeighborLists, resetKiezNeighborIndexCache } =
	await import('./kiez-neighbors-index.js');

function row(slug: string, composite: number, dim: number) {
	return {
		slug,
		composite,
		ruheLuft: dim,
		gruenHitze: dim,
		mobilitaet: dim,
		versorgung: dim,
		wohnschutz: dim
	};
}

// reuterstrasse grenzt an schillerpromenade und rixdorf (beide Nachbarn).
// buchholz, karlshorst und alexanderplatz liegen nicht an der Reuterstraße.
const ROWS = [
	row('reuterstrasse', 50, 50),
	row('schillerpromenade', 52.4, 10),
	row('rixdorf', 40.6, 90),
	row('karlshorst', 70, 52),
	row('buchholz', 60, 55),
	row('alexanderplatz', 30, 80)
];

// Liest und verschneidet die echten LOR-Polygone; unter Volllast der Suite dauert das länger als 5 s.
describe('getKiezNeighborLists', { timeout: 30_000 }, () => {
	const originalUrl = process.env.DATABASE_URL;
	let stderr: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		fromMock.mockReset();
		resetKiezNeighborIndexCache();
		process.env.DATABASE_URL = 'postgres://test/test';
		stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
	});

	afterEach(() => {
		stderr.mockRestore();
		if (originalUrl === undefined) delete process.env.DATABASE_URL;
		else process.env.DATABASE_URL = originalUrl;
	});

	it('füllt similar sortiert nach Abstand und rundet den Score der Nachbarn', async () => {
		fromMock.mockResolvedValue(ROWS);
		const lists = await getKiezNeighborLists('reuterstrasse');
		expect(lists.similar.map((e) => e.slug)).toEqual(['karlshorst', 'buchholz', 'alexanderplatz']);
		const schiller = lists.neighbors.find((n) => n.slug === 'schillerpromenade');
		expect(schiller).toMatchObject({ composite: 52, bezirkName: 'Neukölln' });
		const rixdorf = lists.neighbors.find((n) => n.slug === 'rixdorf');
		expect(rixdorf?.composite).toBe(41);
		expect(lists.neighbors.map((n) => n.slug).indexOf('schillerpromenade')).toBeLessThan(
			lists.neighbors.map((n) => n.slug).indexOf('rixdorf')
		);
		expect(lists.similar.every((e) => !lists.neighbors.some((n) => n.slug === e.slug))).toBe(true);
	});

	it('baut den Index nur einmal, wenn alles geladen ist', async () => {
		fromMock.mockResolvedValue(ROWS);
		await getKiezNeighborLists('reuterstrasse');
		await getKiezNeighborLists('rixdorf');
		expect(fromMock).toHaveBeenCalledTimes(1);
	});

	it('liefert bei DB-Fehler Nachbarn ohne Score und eine leere Ähnlichkeitsliste', async () => {
		fromMock.mockRejectedValue(new Error('connection refused'));
		const lists = await getKiezNeighborLists('reuterstrasse');
		expect(lists.neighbors.length).toBeGreaterThanOrEqual(3);
		expect(lists.neighbors.every((n) => n.composite === null)).toBe(true);
		expect(lists.similar).toEqual([]);
	});

	it('cacht kein Ergebnis nach einem Fehler und lädt beim nächsten Aufruf neu', async () => {
		fromMock.mockRejectedValueOnce(new Error('timeout')).mockResolvedValue(ROWS);
		const failed = await getKiezNeighborLists('reuterstrasse');
		expect(failed.similar).toEqual([]);
		const recovered = await getKiezNeighborLists('reuterstrasse');
		expect(recovered.similar.length).toBe(3);
		expect(fromMock).toHaveBeenCalledTimes(2);
	});

	it('liefert ohne DATABASE_URL Nachbarn ohne Score und ohne DB-Zugriff', async () => {
		delete process.env.DATABASE_URL;
		const lists = await getKiezNeighborLists('reuterstrasse');
		expect(lists.neighbors.length).toBeGreaterThanOrEqual(3);
		expect(lists.similar).toEqual([]);
		expect(fromMock).not.toHaveBeenCalled();
	});

	it('liefert für unbekannte Slugs leere Listen', async () => {
		fromMock.mockResolvedValue(ROWS);
		expect(await getKiezNeighborLists('gibt-es-nicht')).toEqual({ neighbors: [], similar: [] });
	});
});
