import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import ErrorContent from './error-content.svelte';

const CASES = [
	{
		status: 404,
		de: ['Seite nicht gefunden | navigator.berlin', 'Seite nicht gefunden'],
		en: ['Page not found | navigator.berlin', 'Page not found']
	},
	{
		status: 400,
		de: ['Anfrage fehlgeschlagen | navigator.berlin', 'Anfrage nicht möglich'],
		en: ['Request failed | navigator.berlin', 'Request not possible']
	},
	{
		status: 500,
		de: ['Fehler | navigator.berlin', 'Etwas ist schiefgelaufen'],
		en: ['Error | navigator.berlin', 'Something went wrong']
	}
] as const;

describe('ErrorContent', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	for (const { status, de, en } of CASES) {
		for (const [locale, [title, heading]] of [
			['de', de],
			['en', en]
		] as const) {
			it(`${status} ${locale}: Titel, Überschrift, noindex`, async () => {
				overwriteGetLocale(() => locale);
				render(ErrorContent, { status });
				await new Promise((r) => setTimeout(r, 20));
				expect(document.title).toBe(title);
				expect(document.querySelector('h1')?.textContent).toBe(heading);
				expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
					'noindex'
				);
			});
		}
	}

	it('nav-Label ist nicht der Seitentitel', () => {
		render(ErrorContent, { status: 404 });
		expect(document.querySelector('nav')?.getAttribute('aria-label')).toBe('Weiter');
	});
});
