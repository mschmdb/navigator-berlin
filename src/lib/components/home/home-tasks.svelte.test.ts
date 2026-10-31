import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { parseWahlSlug } from '$lib/data/wahl-slug.js';
import HomeTasks from './home-tasks.svelte';

afterEach(() => overwriteGetLocale(() => 'de'));

function hrefs(taskId: string): string[] {
	return [...document.querySelectorAll(`[data-testid="home-task-${taskId}"] ul a`)].map(
		(a) => a.getAttribute('href')!
	);
}

describe('HomeTasks', () => {
	it('rendert vier Aufgaben mit je einer h2', () => {
		render(HomeTasks);
		const headings = document.querySelectorAll('[data-testid^="home-task-"] h2');
		expect(headings).toHaveLength(4);
	});

	it('Aufgabe Gegend prüfen hat zwei Links: Karte und Kiez-Finder', () => {
		render(HomeTasks);
		expect(hrefs('gegend')).toEqual(['/explore', '/explore?finder=1']);
	});

	it('Aufgaben Kieze, Hitze und Wahlen haben je drei Links', () => {
		render(HomeTasks);
		expect(hrefs('kieze')).toEqual(['/kieze', '/bezirke', '/kiez-score']);
		expect(hrefs('klima')).toEqual(['/hitze', '/kaelte', '/daten']);
		expect(hrefs('wahlen')).toEqual([
			'/berlin-wahlen',
			'/berlin-wahlen/2026-agh-zweitstimme',
			'/berlin-wahlen/2025-btw-zweitstimme'
		]);
	});

	it('EN: Links tragen das /en-Präfix', () => {
		overwriteGetLocale(() => 'en');
		render(HomeTasks);
		expect(hrefs('klima')).toEqual(['/en/hitze', '/en/kaelte', '/en/daten']);
	});

	it('Links tragen die Mindest-Klickziel-Klasse und haben max-w-(--measure)', () => {
		render(HomeTasks);
		for (const a of document.querySelectorAll('[data-testid^="home-task-"] ul a')) {
			expect(a.className).toContain('min-h-(--target-min)');
		}
		for (const p of document.querySelectorAll('[data-testid^="home-task-"] p')) {
			expect(p.classList.contains('max-w-(--measure)')).toBe(true);
		}
	});

	it('Wahl-Links zeigen auf Slugs, die parseWahlSlug kennt', () => {
		render(HomeTasks);
		for (const href of hrefs('wahlen').slice(1)) {
			expect(parseWahlSlug(href.split('/').pop()!)).not.toBeNull();
		}
	});

	it('Aufgaben-Links sind als Buttons gestaltet (Rahmen, Mindesthöhe)', () => {
		render(HomeTasks);
		const links = [...document.querySelectorAll('[data-testid^="home-task-"] a')];
		expect(links.length).toBeGreaterThan(0);
		for (const a of links) {
			expect(a.classList.contains('border')).toBe(true);
			expect(a.classList.contains('min-h-(--target-min)')).toBe(true);
		}
	});
});
