import { describe, expect, it } from 'vitest';
import {
	PIN_ICON_MAP,
	PIN_LAYER_SLUGS,
	getPinIcon,
	hasPinIcon,
	type PinIconSpec
} from './pin-icon-mapping.js';
import { COLORS } from './colors.js';

const EXPECTED_SLUGS = [
	'stolpersteine',
	'trinkbrunnen',
	'kitas-2024',
	'schulen-2024',
	'krankenhaeuser-plan',
	'krankenhaeuser-weitere',
	'sportanlagen-2024',
	'schwimmbaeder',
	'ubahn-stationen',
	'sbahn-stationen',
	'tram-haltestellen',
	'bus-haltestellen'
] as const;

describe('pin-icon-mapping.PIN_ICON_MAP', () => {
	it('deckt alle 12 Point-Layer der Story 1.15', () => {
		for (const slug of EXPECTED_SLUGS) {
			expect(PIN_ICON_MAP[slug]).toBeDefined();
		}
		expect(Object.keys(PIN_ICON_MAP).sort()).toEqual([...EXPECTED_SLUGS].sort());
	});

	it('mapped Stolperstein auf Bookmark mit Memorial-Stolperstein-Token', () => {
		const entry = PIN_ICON_MAP['stolpersteine'];
		expect(entry.iconName).toBe('bookmark');
		expect(entry.colorToken).toBe('memorialStolperstein');
	});

	it('mapped Trinkbrunnen auf Droplet', () => {
		expect(PIN_ICON_MAP['trinkbrunnen'].iconName).toBe('droplet');
		expect(PIN_ICON_MAP['trinkbrunnen'].colorToken).toBe('umweltTrinkbrunnen');
	});

	it('mapped Kita auf Baby', () => {
		expect(PIN_ICON_MAP['kitas-2024'].iconName).toBe('baby');
		expect(PIN_ICON_MAP['kitas-2024'].colorToken).toBe('sozialKita');
	});

	it('mapped Schule auf School', () => {
		expect(PIN_ICON_MAP['schulen-2024'].iconName).toBe('school');
		expect(PIN_ICON_MAP['schulen-2024'].colorToken).toBe('sozialSchule');
	});

	it('mapped beide Krankenhaus-Layer auf Plus', () => {
		expect(PIN_ICON_MAP['krankenhaeuser-plan'].iconName).toBe('plus');
		expect(PIN_ICON_MAP['krankenhaeuser-plan'].colorToken).toBe('sozialKrankenhaus');
		expect(PIN_ICON_MAP['krankenhaeuser-weitere'].iconName).toBe('plus');
		expect(PIN_ICON_MAP['krankenhaeuser-weitere'].colorToken).toBe('sozialKrankenhausSecondary');
	});

	it('mapped Sport auf Dumbbell', () => {
		expect(PIN_ICON_MAP['sportanlagen-2024'].iconName).toBe('dumbbell');
		expect(PIN_ICON_MAP['sportanlagen-2024'].colorToken).toBe('sozialSport');
	});

	it('mapped Schwimmbäder auf Waves', () => {
		expect(PIN_ICON_MAP['schwimmbaeder'].iconName).toBe('waves');
		expect(PIN_ICON_MAP['schwimmbaeder'].colorToken).toBe('sozialSchwimmbad');
	});

	it('mapped U-Bahn auf TrainFront mit Mobility-Ubahn-Token', () => {
		expect(PIN_ICON_MAP['ubahn-stationen'].iconName).toBe('train-front');
		expect(PIN_ICON_MAP['ubahn-stationen'].colorToken).toBe('mobilityUbahn');
	});

	it('mapped S-Bahn auf TrainTrack', () => {
		expect(PIN_ICON_MAP['sbahn-stationen'].iconName).toBe('train-track');
		expect(PIN_ICON_MAP['sbahn-stationen'].colorToken).toBe('mobilitySbahn');
	});

	it('mapped Tram auf TramFront', () => {
		expect(PIN_ICON_MAP['tram-haltestellen'].iconName).toBe('tram-front');
		expect(PIN_ICON_MAP['tram-haltestellen'].colorToken).toBe('mobilityTram');
	});

	it('mapped Bus auf Bus', () => {
		expect(PIN_ICON_MAP['bus-haltestellen'].iconName).toBe('bus');
		expect(PIN_ICON_MAP['bus-haltestellen'].colorToken).toBe('mobilityBus');
	});

	it('jeder colorToken ist ein gültiger COLORS-Key', () => {
		const colorKeys = new Set(Object.keys(COLORS));
		for (const slug of EXPECTED_SLUGS) {
			const entry: PinIconSpec = PIN_ICON_MAP[slug];
			expect(colorKeys.has(entry.colorToken)).toBe(true);
		}
	});

	it('jede Entry hat mindestens einen SVG-Node mit valider Geometry', () => {
		for (const slug of EXPECTED_SLUGS) {
			const entry = PIN_ICON_MAP[slug];
			expect(entry.svgNodes.length).toBeGreaterThan(0);
			for (const node of entry.svgNodes) {
				expect(['path', 'circle', 'rect', 'line']).toContain(node.tag);
				expect(typeof node.attrs).toBe('object');
			}
		}
	});

	it('exportiert PIN_LAYER_SLUGS als ReadonlySet aller 12 Slugs', () => {
		expect(PIN_LAYER_SLUGS.size).toBe(EXPECTED_SLUGS.length);
		for (const slug of EXPECTED_SLUGS) {
			expect(PIN_LAYER_SLUGS.has(slug)).toBe(true);
		}
	});
});

describe('pin-icon-mapping.getPinIcon', () => {
	it('liefert Spec für bekannten Slug', () => {
		const spec = getPinIcon('stolpersteine');
		expect(spec).not.toBeNull();
		expect(spec?.iconName).toBe('bookmark');
	});

	it('liefert null für unbekannten Slug', () => {
		expect(getPinIcon('bezirke')).toBeNull();
		expect(getPinIcon('unknown')).toBeNull();
		expect(getPinIcon('')).toBeNull();
	});
});

describe('pin-icon-mapping.hasPinIcon', () => {
	it('liefert true für Point-Layer mit Icon', () => {
		expect(hasPinIcon('stolpersteine')).toBe(true);
		expect(hasPinIcon('kitas-2024')).toBe(true);
	});

	it('liefert false für Layer ohne Icon', () => {
		expect(hasPinIcon('bezirke')).toBe(false);
		expect(hasPinIcon('laerm-2023')).toBe(false);
	});
});
