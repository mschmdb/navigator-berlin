import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KlimaSection from './klima-section.svelte';
import type { ClimateStation, ClimateData, YearValue } from '$lib/data';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

function makeSeries(): YearValue[] {
	return [
		{ year: 1980, count: 8 },
		{ year: 2000, count: 12 },
		{ year: 2024, count: 18 }
	];
}

const STATION: ClimateStation = {
	id: '00403',
	name: 'Berlin-Dahlem',
	coordinates: [13.3017, 52.4537],
	firstYear: 1881
};

const SERIES: ClimateData = {
	stationId: '00403',
	name: 'Berlin-Dahlem',
	coordinates: [13.3017, 52.4537],
	elevation: 51,
	firstYear: 1881,
	summerDays: makeSeries(),
	frostDays: makeSeries(),
	hotDays: makeSeries(),
	annualMeanTemp: [
		{ year: 1980, temp: 9.1 },
		{ year: 2024, temp: 10.7 }
	]
};

describe('KlimaSection lazy-load', () => {
	it('renders skeleton placeholder before charts load', async () => {
		const screen = render(KlimaSection, {
			station: STATION,
			series: SERIES
		});
		const skeleton = screen.container.querySelector('[data-testid="klima-skeleton"]');
		expect(skeleton).not.toBeNull();
		expect(skeleton?.getAttribute('aria-busy')).toBe('true');
		expect(skeleton?.textContent).toMatch(/lädt/i);
	});

	it('renders empty state without lazy-loading when no station', async () => {
		const screen = render(KlimaSection, {
			station: null,
			series: null
		});
		const empty = screen.container.querySelector('[data-testid="section-klima-empty"]');
		expect(empty).not.toBeNull();
		const skeleton = screen.container.querySelector('[data-testid="klima-skeleton"]');
		expect(skeleton).toBeNull();
	});

	it('eventually renders sparkline grid after dynamic-import resolves', async () => {
		const screen = render(KlimaSection, {
			station: STATION,
			series: SERIES
		});
		for (let i = 0; i < 80; i += 1) {
			const grid = screen.container.querySelector('[data-testid="klima-sparkline-grid"]');
			if (grid !== null) {
				expect(grid).not.toBeNull();
				return;
			}
			await new Promise((r) => setTimeout(r, 50));
		}
		throw new Error('klima-sparkline-grid never appeared after lazy-load');
	}, 8000);

	it('renders DataStandBanner with DWD source attribution', async () => {
		const screen = render(KlimaSection, {
			station: STATION,
			series: SERIES
		});
		const banner = screen.container.querySelector('[data-testid="data-stand-banner"]');
		expect(banner).not.toBeNull();
	});

	// i18n Block B3b
	it('lang="en": Heading + Messreihe-Hinweis englisch', async () => {
		const screen = render(KlimaSection, { station: STATION, series: SERIES, lang: 'en' });
		expect(screen.container.querySelector('h4')?.textContent).toContain('Climate · DWD station');
		const hint = screen.container.querySelector('[data-testid="klima-station-hint"]');
		expect(hint?.textContent).toBe('Data series since 1881');
	});

	it('rendert englisch über den Default-Pfad (getLocale())', async () => {
		overwriteGetLocale(() => 'en');
		const screen = render(KlimaSection, { station: STATION, series: SERIES });
		const hint = screen.container.querySelector('[data-testid="klima-station-hint"]');
		expect(hint?.textContent).toBe('Data series since 1881');
	});
});
