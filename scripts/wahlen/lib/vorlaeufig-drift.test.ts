import { describe, expect, it } from 'vitest';
import { findVorlaeufigDrift } from './vorlaeufig-drift';
import type { WahlSource } from './sources';

const source = (wahl: WahlSource['wahl'], jahr: number, vorlaeufig?: boolean): WahlSource => ({
	slug: `${wahl}${jahr}`,
	wahl,
	jahr,
	url: 'https://example.org',
	license: 'x',
	licenseShort: 'x',
	kind: 'wb-csv',
	vorlaeufig
});

describe('findVorlaeufigDrift', () => {
	it('meldet eine Wahl, die in der DB noch vorläufig ist, in der Config aber final', () => {
		const drift = findVorlaeufigDrift(
			[
				{ typ: 'agh', jahr: 2026, vorlaeufig: true },
				{ typ: 'agh', jahr: 2026, vorlaeufig: true }
			],
			[source('agh', 2026)]
		);
		expect(drift).toEqual(['agh-2026']);
	});

	it('meldet auch die Gegenrichtung (Config vorläufig, DB final)', () => {
		const drift = findVorlaeufigDrift(
			[{ typ: 'bvv', jahr: 2026, vorlaeufig: false }],
			[source('bvv', 2026, true)]
		);
		expect(drift).toEqual(['bvv-2026']);
	});

	it('meldet nichts, wenn DB und Config übereinstimmen', () => {
		const drift = findVorlaeufigDrift(
			[
				{ typ: 'agh', jahr: 2026, vorlaeufig: false },
				{ typ: 'btw', jahr: 2025, vorlaeufig: false }
			],
			[source('agh', 2026), source('btw', 2025, false)]
		);
		expect(drift).toEqual([]);
	});

	it('ignoriert DB-Wahlen ohne passende Quelle', () => {
		expect(findVorlaeufigDrift([{ typ: 'btw', jahr: 2009, vorlaeufig: true }], [])).toEqual([]);
	});
});
