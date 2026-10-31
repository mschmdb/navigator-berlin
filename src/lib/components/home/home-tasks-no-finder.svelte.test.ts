import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HomeTasks from './home-tasks.svelte';

vi.mock('$lib/data/feature-flags.js', () => ({ featureFlags: { kiezFinder: false } }));

describe('HomeTasks ohne Kiez-Finder', () => {
	it('zeigt kein Finder-Bild und nur den Karten-Link', () => {
		render(HomeTasks);
		expect(document.querySelector('[data-testid="home-preview-finder"]')).toBeNull();
		const hrefs = [...document.querySelectorAll('[data-testid="home-task-gegend"] ul a')].map((a) =>
			a.getAttribute('href')
		);
		expect(hrefs).toEqual(['/explore']);
	});
});
