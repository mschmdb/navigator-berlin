import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { UpdateEntry } from '$lib/content/updates/types.js';

// `page.url` ist im Test-Browser nicht steuerbar, daher ein kontrollierter Stub.
// Der Filter-Toggle-Klick ist nicht Teil dieses Tests (vorbestehender Bug).
const state = vi.hoisted(() => ({ url: new URL('https://example.test/updates') }));
vi.mock('$app/state', () => ({
	page: {
		get url() {
			return state.url;
		}
	}
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const { default: Page } = await import('./+page.svelte');

function makeEntry(slug: string, category: UpdateEntry['frontmatter']['category']): UpdateEntry {
	return {
		slug,
		filePath: `/_content/updates/2026-05-15-${slug}.md`,
		frontmatter: {
			title_de: slug,
			title_en: `${slug} EN`,
			summary_de: `Zusammenfassung ${slug}.`,
			summary_en: `Summary ${slug}.`,
			date: '2026-05-15',
			category,
			lang: 'de'
		},
		body: 'Body',
		bodyEn: 'Body EN'
	};
}

const entries = [makeEntry('a', 'presse'), makeEntry('b', 'presse'), makeEntry('c', 'feature')];

describe('updates/+page.svelte · gefiltertes Feedback über ?cat= (i18n C4d)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	async function feedback(locale: 'de' | 'en', query: string): Promise<string> {
		overwriteGetLocale(() => locale);
		state.url = new URL(`https://example.test/updates${query}`);
		render(Page, { data: { entries } as never });
		await new Promise((r) => setTimeout(r, 30));
		const el = document.querySelector('[data-testid="updates-filter-feedback"]')!;
		return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
	}

	it('DE: ein Treffer nutzt den Singular', async () => {
		expect(await feedback('de', '?cat=feature')).toBe('1 Eintrag gefiltert.');
	});

	it('DE: mehrere Treffer nutzen den Plural', async () => {
		expect(await feedback('de', '?cat=presse')).toBe('2 Einträge gefiltert.');
	});

	it('EN: ein Treffer nutzt den Singular', async () => {
		expect(await feedback('en', '?cat=feature')).toBe('1 entry filtered.');
	});

	it('EN: mehrere Treffer nutzen den Plural', async () => {
		expect(await feedback('en', '?cat=presse')).toBe('2 entries filtered.');
	});

	it('mehrere Kategorien addieren die Treffer', async () => {
		expect(await feedback('en', '?cat=presse,feature')).toBe('3 entries filtered.');
	});
});
