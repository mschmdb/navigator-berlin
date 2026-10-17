import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import QuellenZeile from './quellen-zeile.svelte';

/** Sichtbarer Text ohne Screenreader-Hinweise, mit zusammengefassten Leerzeichen. */
function sichtbarerText(): string {
	const el = document.querySelector('[data-testid="kaelte-quellen"]') as HTMLElement;
	const kopie = el.cloneNode(true) as HTMLElement;
	kopie.querySelectorAll('.sr-only').forEach((n) => n.remove());
	return (kopie.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('QuellenZeile', () => {
	it('trennt zwei Quellen mit Komma und Leerzeichen', async () => {
		render(QuellenZeile, {
			quellen: [
				{ label: 'berlin.de/kaeltehilfe', url: 'https://www.berlin.de/kaeltehilfe/' },
				{ label: 'GEBEWO pro', url: 'https://gebewo.berlin/' }
			]
		});
		expect(sichtbarerText()).toBe('Quellen: berlin.de/kaeltehilfe, GEBEWO pro');
	});

	it('setzt bei einer Quelle kein Komma', async () => {
		render(QuellenZeile, { quellen: [{ label: 'Kältehilfe Berlin' }] });
		expect(sichtbarerText()).toBe('Quellen: Kältehilfe Berlin');
	});

	it('trennt drei Quellen, auch ohne Link', async () => {
		render(QuellenZeile, {
			quellen: [
				{ label: 'A', url: 'https://a.example/' },
				{ label: 'B' },
				{ label: 'C', url: 'https://c.example/' }
			]
		});
		expect(sichtbarerText()).toBe('Quellen: A, B, C');
	});

	it('behält den Hinweis auf den neuen Tab an verlinkten Quellen', async () => {
		render(QuellenZeile, {
			quellen: [{ label: 'GEBEWO pro', url: 'https://gebewo.berlin/' }, { label: 'Ohne Link' }]
		});
		const link = document.querySelector('a[href="https://gebewo.berlin/"]') as HTMLAnchorElement;
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.parentElement?.textContent).toContain('(öffnet neuen Tab)');
		expect(document.querySelectorAll('.sr-only')).toHaveLength(1);
	});
});
