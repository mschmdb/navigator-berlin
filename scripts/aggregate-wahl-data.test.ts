import { describe, it, expect } from 'vitest';
import { parseArgs, resolveTargets } from './aggregate-wahl-data.js';
import type { WahlSource } from './wahlen/lib/sources.js';

const FAKE_SOURCES: WahlSource[] = [
	{
		slug: 'agh26',
		wahl: 'agh',
		jahr: 2026,
		url: 'https://example.invalid/agh26',
		license: 'x',
		licenseShort: 'x',
		kind: 'wb-csv'
	},
	{
		slug: 'bvv26',
		wahl: 'bvv',
		jahr: 2026,
		url: 'https://example.invalid/bvv26',
		license: 'x',
		licenseShort: 'x',
		kind: 'wb-csv'
	}
];

describe('aggregate-wahl-data parseArgs', () => {
	it('parst --only als kommagetrennte Slug-Liste (Story: Ingest AGH/BVV 2026)', () => {
		expect(parseArgs(['--only=agh23,agh26,bvv26'])).toEqual({
			only: ['agh23', 'agh26', 'bvv26'],
			skipDriftCheck: false
		});
	});

	it('parst --only mit einem einzelnen Slug (Bestand)', () => {
		expect(parseArgs(['--only=btw25'])).toEqual({ only: ['btw25'], skipDriftCheck: false });
	});

	it('trimmt Whitespace um Kommas', () => {
		expect(parseArgs(['--only=agh23, agh26 ,bvv26'])).toEqual({
			only: ['agh23', 'agh26', 'bvv26'],
			skipDriftCheck: false
		});
	});

	it('ohne --only bleibt only undefined', () => {
		expect(parseArgs([])).toEqual({ only: undefined, skipDriftCheck: false });
	});

	it('parst --skip-drift-check', () => {
		expect(parseArgs(['--only=btw13', '--skip-drift-check'])).toEqual({
			only: ['btw13'],
			skipDriftCheck: true
		});
	});
});

describe('resolveTargets (Review-Fund 23.09.: unbekannter Slug neben gültigen)', () => {
	it('ohne --only: alle Sources sind Targets, keine unknown', () => {
		const { targets, unknown } = resolveTargets(undefined, FAKE_SOURCES);
		expect(targets).toEqual(FAKE_SOURCES);
		expect(unknown).toEqual([]);
	});

	it('nur gültige Slugs: alle als Targets, keine unknown', () => {
		const { targets, unknown } = resolveTargets(['agh26'], FAKE_SOURCES);
		expect(targets.map((t) => t.slug)).toEqual(['agh26']);
		expect(unknown).toEqual([]);
	});

	it('ein unbekannter Slug NEBEN gültigen wird gemeldet, nicht still übersprungen', () => {
		const { targets, unknown } = resolveTargets(['agh26', 'doesnotexist'], FAKE_SOURCES);
		expect(targets.map((t) => t.slug)).toEqual(['agh26']);
		expect(unknown).toEqual(['doesnotexist']);
	});

	it('nur unbekannte Slugs: leere Targets, alle als unknown gemeldet', () => {
		const { targets, unknown } = resolveTargets(['doesnotexist'], FAKE_SOURCES);
		expect(targets).toEqual([]);
		expect(unknown).toEqual(['doesnotexist']);
	});
});
