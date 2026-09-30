import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import UpdatesFilter from './updates-filter.svelte';

function texts(): { heading: string; labels: string[]; aria: (string | null)[] } {
	const root = document.querySelector('[data-testid="updates-filter"]')!;
	return {
		heading: root.querySelector('p')?.textContent?.trim() ?? '',
		labels: [...root.querySelectorAll('[data-testid="filter-toggle"]')].map(
			(el) => el.textContent?.trim() ?? ''
		),
		aria: [root, ...root.querySelectorAll('[aria-label]')].map((el) =>
			el.getAttribute('aria-label')
		)
	};
}

describe('updates-filter.svelte (i18n C4d)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('DE-Wortlaut bleibt unverändert', () => {
		render(UpdatesFilter, {});
		expect(texts()).toEqual({
			heading: 'Kategorien',
			labels: ['Daten-Update', 'Feature', 'Methodik', 'Datenquelle', 'Lizenz', 'Presse'],
			aria: ['Update-Kategorien filtern', 'Update-Kategorien filtern']
		});
	});

	it('EN zeigt Überschrift, Labels und aria-label englisch', () => {
		overwriteGetLocale(() => 'en');
		render(UpdatesFilter, {});
		expect(texts()).toEqual({
			heading: 'Categories',
			labels: ['Data update', 'Feature', 'Methodology', 'Data source', 'Licence', 'Press'],
			aria: ['Filter update categories', 'Filter update categories']
		});
	});
});
