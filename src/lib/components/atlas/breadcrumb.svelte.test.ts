import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Breadcrumb from './breadcrumb.svelte';

const ITEMS = [
	{ name: 'Berlin', path: '/' },
	{ name: 'Pankow', path: '/bezirk/pankow' },
	{ name: 'Prenzlauer Berg', path: '/kiez/prenzlauer-berg' }
];

describe('breadcrumb.svelte', () => {
	it('rendert nav-Landmark mit aria-label', async () => {
		render(Breadcrumb, { items: ITEMS });
		const nav = (await page.getByTestId('breadcrumb').element()) as HTMLElement;
		expect(nav.tagName).toBe('NAV');
		expect(nav.getAttribute('aria-label')).toBeTruthy();
	});

	it('alle Items außer dem letzten sind Links mit korrektem href', async () => {
		render(Breadcrumb, { items: ITEMS });
		const links = document.querySelectorAll('[data-testid="breadcrumb"] a');
		expect(links.length).toBe(2);
		expect(links[0].getAttribute('href')).toBe('/');
		expect(links[1].getAttribute('href')).toBe('/bezirk/pankow');
	});

	it('letztes Item ist kein Link und trägt aria-current="page"', async () => {
		render(Breadcrumb, { items: ITEMS });
		const current = (await page.getByText('Prenzlauer Berg').element()) as HTMLElement;
		expect(current.tagName).not.toBe('A');
		expect(current.getAttribute('aria-current')).toBe('page');
	});

	it('rendert nichts bei leerer Liste', async () => {
		render(Breadcrumb, { items: [] });
		expect(document.querySelector('[data-testid="breadcrumb"]')).toBeNull();
	});
});
