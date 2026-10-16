import { describe, expect, it } from 'vitest';
import { classifyPlace, type ClassifyInput } from './filter.js';

function input(tags: Record<string, string>, oh = ''): ClassifyInput {
	return { tags, oh };
}

const HOURS = 'Mo-Fr 10:00-18:00';

describe('classifyPlace', () => {
	it('Bibliothek ist Kandidat', () => {
		expect(classifyPlace(input({ amenity: 'library' }))).toEqual({
			candidate: true,
			cat: 'Bibliothek'
		});
	});

	it('Mall und Kaufhaus sind Kandidaten', () => {
		expect(classifyPlace(input({ shop: 'mall' }))).toEqual({ candidate: true, cat: 'Mall' });
		expect(classifyPlace(input({ shop: 'department_store' }))).toEqual({
			candidate: true,
			cat: 'Kaufhaus'
		});
	});

	it('Museum mit fee=yes ist kein Kandidat', () => {
		expect(classifyPlace(input({ tourism: 'museum', fee: 'yes' }))).toEqual({
			candidate: false,
			reason: 'museum_fee'
		});
	});

	it('Museum mit fee=no oder ohne fee-Tag ist Kandidat', () => {
		expect(classifyPlace(input({ tourism: 'museum', fee: 'no' }))).toEqual({
			candidate: true,
			cat: 'Museum'
		});
		expect(classifyPlace(input({ tourism: 'museum' }))).toEqual({ candidate: true, cat: 'Museum' });
	});

	it('Gotteshaus braucht opening_hours', () => {
		const church = { amenity: 'place_of_worship', religion: 'christian' };
		expect(classifyPlace(input(church))).toEqual({ candidate: false, reason: 'no_opening_hours' });
		expect(classifyPlace(input(church, HOURS))).toEqual({ candidate: true, cat: 'Kirche' });
		expect(
			classifyPlace(input({ amenity: 'place_of_worship', religion: 'muslim' }, HOURS))
		).toEqual({ candidate: true, cat: 'Gotteshaus' });
	});

	it('Stadtteilzentrum: erlaubte Untertypen und ohne Untertyp, mit opening_hours', () => {
		const subtypes = [
			'community_hall',
			'social_centre',
			'village_hall',
			'cultural_centre',
			'family_centre'
		];
		for (const sub of subtypes) {
			expect(
				classifyPlace(input({ amenity: 'community_centre', community_centre: sub }, HOURS))
			).toEqual({ candidate: true, cat: 'Stadtteilzentrum' });
		}
		expect(classifyPlace(input({ amenity: 'community_centre' }, HOURS))).toEqual({
			candidate: true,
			cat: 'Stadtteilzentrum'
		});
	});

	it('Stadtteilzentrum ohne opening_hours ist kein Kandidat', () => {
		expect(classifyPlace(input({ amenity: 'community_centre' }))).toEqual({
			candidate: false,
			reason: 'no_opening_hours'
		});
	});

	it('Jugendzentrum und unbekannte Untertypen sind gruppenspezifisch', () => {
		for (const sub of ['youth_centre', 'club_house']) {
			expect(
				classifyPlace(input({ amenity: 'community_centre', community_centre: sub }, HOURS))
			).toEqual({ candidate: false, reason: 'group_specific' });
		}
	});

	it('privater Zugang schließt aus', () => {
		for (const access of ['private', 'members', 'customers']) {
			expect(classifyPlace(input({ amenity: 'library', access }))).toEqual({
				candidate: false,
				reason: 'access_restricted'
			});
		}
		expect(classifyPlace(input({ amenity: 'library', access: 'yes' }))).toEqual({
			candidate: true,
			cat: 'Bibliothek'
		});
	});

	it('Notübernachtung schließt aus', () => {
		expect(
			classifyPlace(input({ amenity: 'community_centre', social_facility: 'shelter' }, HOURS))
		).toEqual({ candidate: false, reason: 'shelter' });
	});

	it('andere social_facility-Werte sind gruppenspezifisch', () => {
		expect(
			classifyPlace(input({ amenity: 'community_centre', social_facility: 'nursing_home' }, HOURS))
		).toEqual({ candidate: false, reason: 'group_specific' });
	});

	it('Objekte ohne bekannte Kategorie fallen heraus', () => {
		expect(classifyPlace(input({ amenity: 'cafe' }))).toEqual({
			candidate: false,
			reason: 'no_category'
		});
	});
});

describe('classifyPlace: access=no', () => {
	it('schließt access=no aus', () => {
		expect(classifyPlace({ tags: { amenity: 'library', access: 'no' }, oh: '' })).toEqual({
			candidate: false,
			reason: 'access_restricted'
		});
	});
});
