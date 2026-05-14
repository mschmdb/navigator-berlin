import { describe, expect, it } from 'vitest';
import type { Bundle } from '$lib/data';
import { sortSlugsByBundleStable, type LayerBundleLookup } from './layer-order-sorting.js';

const META: readonly LayerBundleLookup[] = [
	{ slug: 'bezirke', bundleGroup: 'A: Boundaries' as Bundle },
	{ slug: 'ortsteile', bundleGroup: 'A: Boundaries' as Bundle },
	{ slug: 'wohnlagen-2024', bundleGroup: 'B: Wohn-Daten' as Bundle },
	{ slug: 'bodenrichtwerte', bundleGroup: 'B: Wohn-Daten' as Bundle },
	{ slug: 'laerm-2023', bundleGroup: 'C: Umwelt' as Bundle },
	{ slug: 'klima-pet-2022', bundleGroup: 'C: Umwelt' as Bundle },
	{ slug: 'stolpersteine', bundleGroup: 'D: Memorial' as Bundle },
	{ slug: 'kitas-2024', bundleGroup: 'E: Soziale Infrastruktur' as Bundle },
	{ slug: 'ubahn-netz', bundleGroup: 'F: Mobilität' as Bundle },
	{ slug: 'sbahn-netz', bundleGroup: 'F: Mobilität' as Bundle }
];

describe('layer-order-sorting.sortSlugsByBundleStable', () => {
	it('liefert leere Liste fuer leere Eingabe', () => {
		expect(sortSlugsByBundleStable([], META)).toEqual([]);
	});

	it('Bundle A vor B vor C vor D vor E vor F', () => {
		const sorted = sortSlugsByBundleStable(
			['ubahn-netz', 'kitas-2024', 'stolpersteine', 'laerm-2023', 'wohnlagen-2024', 'bezirke'],
			META
		);
		expect(sorted).toEqual([
			'bezirke',
			'wohnlagen-2024',
			'laerm-2023',
			'stolpersteine',
			'kitas-2024',
			'ubahn-netz'
		]);
	});

	it('innerhalb Bundle Aktivierungs-Reihenfolge erhalten', () => {
		expect(sortSlugsByBundleStable(['wohnlagen-2024', 'bodenrichtwerte'], META)).toEqual([
			'wohnlagen-2024',
			'bodenrichtwerte'
		]);
		expect(sortSlugsByBundleStable(['bodenrichtwerte', 'wohnlagen-2024'], META)).toEqual([
			'bodenrichtwerte',
			'wohnlagen-2024'
		]);
	});

	it('mehrere Layer pro Bundle behalten relative Order', () => {
		const sorted = sortSlugsByBundleStable(
			['sbahn-netz', 'klima-pet-2022', 'laerm-2023', 'ubahn-netz', 'ortsteile', 'bezirke'],
			META
		);
		expect(sorted).toEqual([
			'ortsteile',
			'bezirke',
			'klima-pet-2022',
			'laerm-2023',
			'sbahn-netz',
			'ubahn-netz'
		]);
	});

	it('Slug ohne Manifest-Eintrag landet ans Ende, behaelt relative Order', () => {
		const sorted = sortSlugsByBundleStable(
			['unknown-x', 'laerm-2023', 'unknown-y', 'bezirke'],
			META
		);
		expect(sorted).toEqual(['bezirke', 'laerm-2023', 'unknown-x', 'unknown-y']);
	});

	it('idempotent bei bereits sortierter Eingabe', () => {
		const input = ['bezirke', 'wohnlagen-2024', 'laerm-2023'];
		expect(sortSlugsByBundleStable(input, META)).toEqual(input);
		expect(sortSlugsByBundleStable(sortSlugsByBundleStable(input, META), META)).toEqual(input);
	});
});
