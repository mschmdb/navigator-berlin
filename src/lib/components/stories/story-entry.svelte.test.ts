import { afterEach, describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { StoryEntry } from '$lib/content/stories/types.js';
import StoryEntryItem from './story-entry.svelte';

const entry: StoryEntry = {
	slug: 'neu',
	filePath: '/_content/stories/2026-10-31-neu.md',
	frontmatter: {
		title: 'Neu',
		title_en: 'New',
		summary: 'Kurztext.',
		summary_en: 'Short text.',
		date: '2026-10-31',
		preview: 'punkt-linie-kiez-bezirke'
	},
	body: ''
};
const preview = {
	slug: 'mitte',
	name: 'Mitte',
	kennzahlen: {
		slug: 'mitte',
		gruen: 0.5,
		altbauAnteil: 0.4,
		laermDb: 50,
		bewohnerProKm2: 3000,
		haltestelle400mAnteil: 0.95,
		clubs: 3
	}
};

function mount(props: Record<string, unknown>): HTMLElement {
	render(StoryEntryItem, {
		props: props as never,
		target: document.body.appendChild(document.createElement('ul'))
	});
	return document.querySelector('[data-testid="stories-entry"]') as HTMLElement;
}

afterEach(() => overwriteGetLocale(() => 'de'));

describe('story-entry.svelte', () => {
	it('zeigt Datum, Titel-Link, Summary und eine statische Miniatur', () => {
		const li = mount({ entry, preview });
		expect(li.querySelector('h2 a')?.getAttribute('href')).toBe('/stories/neu');
		expect(li.querySelector('time')?.textContent?.trim()).toBe('31. Oktober 2026');
		expect(li.textContent).toContain('Kurztext.');
		const thumb = li.querySelector('[data-testid="stories-entry-preview"]')!;
		expect(thumb.getAttribute('aria-hidden')).toBe('true');
		expect(thumb.getAttribute('tabindex')).toBe('-1');
		expect(thumb.querySelectorAll('[tabindex]')).toHaveLength(0);
	});

	it('reagiert nicht auf Hover: keine Hervorhebung in der Miniatur', () => {
		const li = mount({ entry, preview });
		const circle = li.querySelector('[data-testid="plk-shape-circle"]')!;
		circle.dispatchEvent(new PointerEvent('pointerenter'));
		flushSync();
		expect(li.querySelector('[data-active], [data-dimmed]')).toBeNull();
	});

	it('nutzt die gewünschte Überschriftenebene', () => {
		const li = mount({ entry, preview, headingLevel: 3 });
		expect(li.querySelector('h3 a')).not.toBeNull();
		expect(li.querySelector('h2')).toBeNull();
	});

	it('lässt die Miniatur ohne preview oder ohne Bezirk weg', () => {
		const noPreview = { ...entry, frontmatter: { ...entry.frontmatter, preview: undefined } };
		expect(
			mount({ entry: noPreview, preview }).querySelector('[data-testid="stories-entry-preview"]')
		).toBeNull();
		document.body.innerHTML = '';
		expect(
			mount({ entry, preview: null }).querySelector('[data-testid="stories-entry-preview"]')
		).toBeNull();
	});

	it('EN: englischer Titel und /en-Link', () => {
		overwriteGetLocale(() => 'en');
		const li = mount({ entry, preview });
		expect(li.querySelector('h2 a')?.textContent?.trim()).toBe('New');
		expect(li.querySelector('h2 a')?.getAttribute('href')).toBe('/en/stories/neu');
	});
});
