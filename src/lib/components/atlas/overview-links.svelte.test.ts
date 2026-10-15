import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import OverviewLinks from './overview-links.svelte';

beforeEach(() => {
	overwriteGetLocale(() => 'de');
});

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

async function link(testid: string): Promise<HTMLAnchorElement> {
	return (await page.getByTestId(testid).element()) as HTMLAnchorElement;
}

describe('overview-links.svelte', () => {
	it('Kiez: verlinkt den Bezirksabschnitt auf /kieze', async () => {
		render(OverviewLinks, { kind: 'kiez', bezirkName: 'Neukölln', bezirkSlug: 'neukoelln' });
		const a = await link('overview-link-kieze');
		expect(a.getAttribute('href')).toBe('/kieze#bezirk-neukoelln');
		expect(a.textContent?.trim()).toBe('Alle Kieze in Neukölln');
		expect(page.getByTestId('overview-link-bezirke').elements()).toHaveLength(0);
	});

	it('Kiez ohne Bezirk: Link auf /kieze ohne Anker', async () => {
		render(OverviewLinks, { kind: 'kiez', bezirkName: '', bezirkSlug: null });
		const a = await link('overview-link-kieze');
		expect(a.getAttribute('href')).toBe('/kieze');
		expect(a.textContent?.trim()).toBe('Alle Kieze');
	});

	it('Kiez mit leerem Slug: Fallback ohne Anker, Label und Href passen zusammen', async () => {
		render(OverviewLinks, { kind: 'kiez', bezirkName: 'Neukölln', bezirkSlug: '' });
		const a = await link('overview-link-kieze');
		expect(a.getAttribute('href')).toBe('/kieze');
		expect(a.textContent?.trim()).toBe('Alle Kieze');
	});

	it('Bezirk: Links auf Bezirksabschnitt und /bezirke', async () => {
		render(OverviewLinks, { kind: 'bezirk', bezirkName: 'Pankow', bezirkSlug: 'pankow' });
		expect((await link('overview-link-kieze')).getAttribute('href')).toBe('/kieze#bezirk-pankow');
		const b = await link('overview-link-bezirke');
		expect(b.getAttribute('href')).toBe('/bezirke');
		expect(b.textContent?.trim()).toBe('Alle Bezirke');
	});

	it('EN: /en-Hrefs und englischer Text', async () => {
		overwriteGetLocale(() => 'en');
		render(OverviewLinks, { kind: 'bezirk', bezirkName: 'Pankow', bezirkSlug: 'pankow' });
		const a = await link('overview-link-kieze');
		expect(a.getAttribute('href')).toBe('/en/kieze#bezirk-pankow');
		expect(a.textContent?.trim()).toBe('All Kieze in Pankow');
		const b = await link('overview-link-bezirke');
		expect(b.getAttribute('href')).toBe('/en/bezirke');
		expect(b.textContent?.trim()).toBe('All Bezirke');
	});
});
