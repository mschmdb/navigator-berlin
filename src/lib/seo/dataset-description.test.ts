import { describe, expect, it } from 'vitest';
import { pickDatasetDescription } from './dataset-description.js';

describe('pickDatasetDescription', () => {
	const fallback = 'Ein ausreichend langer Fallback-Text als Beschreibung fuer den Datensatz.';

	it('nimmt den ersten Kandidaten >= 50 Zeichen', () => {
		const long = 'Lärmbelastung im Stadtteil laut Umweltatlas 2023, Tag-Abend-Nacht-Index.';
		expect(pickDatasetDescription([long], fallback)).toBe(long);
	});

	it('ueberspringt zu kurze Kandidaten (<50) und nimmt den naechsten validen', () => {
		const short = 'Bushaltestelle (BVG)'; // 20 Zeichen
		const long = 'Bushaltestelle im Berliner Nahverkehrsnetz der BVG mit Liniendaten.'; // >= 50
		expect(pickDatasetDescription([short, long], fallback)).toBe(long);
	});

	it('faellt auf den Fallback zurueck, wenn alle Kandidaten zu kurz sind', () => {
		expect(pickDatasetDescription(['Bezirke', 'PLZ'], fallback)).toBe(fallback);
	});

	it('ueberspringt zu lange Kandidaten (> 5000)', () => {
		const tooLong = 'a'.repeat(5001);
		const valid = 'Eine gueltige Beschreibung mit ausreichender Laenge fuer Schema.org.';
		expect(pickDatasetDescription([tooLong, valid], fallback)).toBe(valid);
	});

	it('ignoriert null/undefined/leer', () => {
		const valid = 'Eine gueltige Beschreibung mit ausreichender Laenge fuer Schema.org.';
		expect(pickDatasetDescription([null, undefined, '', valid], fallback)).toBe(valid);
	});

	it('nimmt einen validen kurzen Kandidaten vor dem laengeren', () => {
		const exactly50 = 'a'.repeat(50);
		const longer = 'b'.repeat(120);
		expect(pickDatasetDescription([exactly50, longer], fallback)).toBe(exactly50);
	});
});
