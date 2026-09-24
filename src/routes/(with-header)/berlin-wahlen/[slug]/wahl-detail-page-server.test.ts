import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { WahlListItem } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import type { BerlinResult } from '$lib/server/db/queries/wahl/get-results-for-berlin.js';
import type { WahlDetailPageData } from './+page.server.js';

const {
	getWahlListMock,
	getResultsForBerlinMock,
	getResultsForBezirkMock,
	getStimmbezirksWinnersMock
} = vi.hoisted(() => ({
	getWahlListMock: vi.fn(),
	getResultsForBerlinMock: vi.fn(),
	getResultsForBezirkMock: vi.fn(),
	getStimmbezirksWinnersMock: vi.fn()
}));

vi.mock('$lib/server/db/queries/wahl/get-wahl-list.js', () => ({
	getWahlList: getWahlListMock
}));
vi.mock('$lib/server/db/queries/wahl/get-results-for-berlin.js', () => ({
	getResultsForBerlin: getResultsForBerlinMock
}));
vi.mock('$lib/server/db/queries/wahl/get-results-for-bezirk.js', () => ({
	getResultsForBezirk: getResultsForBezirkMock
}));
vi.mock('$lib/server/db/queries/wahl/get-stimmbezirks-winners.js', () => ({
	getStimmbezirksWinners: getStimmbezirksWinnersMock
}));

const { load } = await import('./+page.server.js');

const ERSTSTIMME_ID = 101;
const ZWEITSTIMME_ID = 102;

function makeWahlListItem(overrides: Partial<WahlListItem>): WahlListItem {
	return {
		id: 1,
		jahr: 2021,
		typ: 'agh',
		stimmtyp: 'zweitstimme',
		isRepeatElection: false,
		parentElectionId: null,
		sourceUrl: 'https://example.org/agh21.csv',
		license: 'dl-de/by-2-0',
		vorlaeufig: false,
		sourceUpdatedAt: null,
		...overrides
	};
}

// Story 16 Matrix-Zeile „Erststimme": 2021-agh-erststimme zeigt Erststimmen-,
// nicht Zweitstimmen-Zahlen. Beide `wahl`-Rows (Erst-/Zweitstimme) haben
// denselben Jahr/Typ, unterscheiden sich nur über `stimmtyp` + `id` -- der
// Test stellt sicher, dass `load` die RICHTIGE Row matched und deren
// (mockseitig klar unterscheidbaren) Berlin-Ergebnisse lädt.
const ERSTSTIMME_BERLIN: BerlinResult[] = [
	{ parteiKurzname: 'CDU', parteiVollname: 'CDU', farbeHex: '#000000', stimmen: 111, anteil: 0.11 }
];
const ZWEITSTIMME_BERLIN: BerlinResult[] = [
	{ parteiKurzname: 'SPD', parteiVollname: 'SPD', farbeHex: '#e3000f', stimmen: 222, anteil: 0.22 }
];

describe('berlin-wahlen/[slug]/+page.server load: Erststimme vs. Zweitstimme (Story 16 Matrix)', () => {
	const originalDatabaseUrl = process.env.DATABASE_URL;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.DATABASE_URL = 'postgres://test/test';
		getResultsForBezirkMock.mockResolvedValue([]);
		getStimmbezirksWinnersMock.mockResolvedValue([]);
	});

	afterEach(() => {
		if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
		else process.env.DATABASE_URL = originalDatabaseUrl;
	});

	it('wählt bei …-erststimme die wahl-Row mit stimmtyp=erststimme und lädt deren Ergebnisse', async () => {
		getWahlListMock.mockResolvedValue([
			makeWahlListItem({ id: ERSTSTIMME_ID, stimmtyp: 'erststimme' }),
			makeWahlListItem({ id: ZWEITSTIMME_ID, stimmtyp: 'zweitstimme' })
		]);
		getResultsForBerlinMock.mockImplementation(async (wahlId: number) =>
			wahlId === ERSTSTIMME_ID ? ERSTSTIMME_BERLIN : ZWEITSTIMME_BERLIN
		);

		const data = (await load({
			params: { slug: '2021-agh-erststimme' }
		} as unknown as Parameters<typeof load>[0])) as WahlDetailPageData;

		expect(data.wahl.id).toBe(ERSTSTIMME_ID);
		expect(data.wahl.stimmtyp).toBe('erststimme');
		expect(getResultsForBerlinMock).toHaveBeenCalledWith(ERSTSTIMME_ID, 10);
		expect(data.berlin).toEqual([
			{ kurzname: 'CDU', vollname: 'CDU', farbeHex: '#000000', stimmen: 111, anteil: 0.11 }
		]);
		// Beweist die Negativ-Aussage der Matrix-Zeile: NICHT die Zweitstimme.
		expect(data.berlin.map((e) => e.kurzname)).not.toContain('SPD');
	});

	it('wählt bei …-zweitstimme (implizit ohne Suffix) die zweitstimme-Row', async () => {
		getWahlListMock.mockResolvedValue([
			makeWahlListItem({ id: ERSTSTIMME_ID, stimmtyp: 'erststimme' }),
			makeWahlListItem({ id: ZWEITSTIMME_ID, stimmtyp: 'zweitstimme' })
		]);
		getResultsForBerlinMock.mockImplementation(async (wahlId: number) =>
			wahlId === ERSTSTIMME_ID ? ERSTSTIMME_BERLIN : ZWEITSTIMME_BERLIN
		);

		const data = (await load({
			params: { slug: '2021-agh-zweitstimme' }
		} as unknown as Parameters<typeof load>[0])) as WahlDetailPageData;

		expect(data.wahl.id).toBe(ZWEITSTIMME_ID);
		expect(data.wahl.stimmtyp).toBe('zweitstimme');
		expect(data.berlin.map((e) => e.kurzname)).not.toContain('CDU');
	});
});

describe('berlin-wahlen/[slug]/+page.server load: 404 bei unbekanntem/ungültigem Slug (Story 16 Matrix)', () => {
	const originalDatabaseUrl = process.env.DATABASE_URL;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.DATABASE_URL = 'postgres://test/test';
	});

	afterEach(() => {
		if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
		else process.env.DATABASE_URL = originalDatabaseUrl;
	});

	it('gültiges Slug-Format ohne passende wahl-Row → 404', async () => {
		getWahlListMock.mockResolvedValue([
			makeWahlListItem({ id: 1, jahr: 2021, typ: 'agh', stimmtyp: 'zweitstimme' })
		]);

		await expect(
			load({
				params: { slug: '2030-agh-zweitstimme' }
			} as unknown as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 404 });
	});

	it('ungültiges Slug-Format → 404, ohne die DB zu befragen', async () => {
		await expect(
			load({
				params: { slug: 'nicht-valide' }
			} as unknown as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 404 });
		expect(getWahlListMock).not.toHaveBeenCalled();
	});
});
