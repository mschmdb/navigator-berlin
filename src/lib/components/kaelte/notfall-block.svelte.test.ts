import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import NotfallBlock from './notfall-block.svelte';

const ABEND_NOVEMBER = new Date('2026-11-16T20:30:00Z'); // Mo 21:30 Berlin
const NACHTS = new Date('2026-12-01T00:30:00Z'); // 1:30 Berlin
const TAGSUEBER = new Date('2026-12-05T13:00:00Z'); // Sa 14:00 Berlin
const OKTOBER = new Date('2026-10-15T18:00:00Z'); // 20:00 MESZ
const JUNI = new Date('2026-06-10T18:00:00Z');

function root(): HTMLElement {
	return document.querySelector('[data-testid="kaelte-notfall"]') as HTMLElement;
}

function statusOf(id: string): string {
	return (
		document.querySelector(`[data-testid="kaelte-dienst-${id}"] [data-testid="kaelte-status"]`)
			?.textContent ?? ''
	).trim();
}

afterEach(() => overwriteGetLocale(() => 'de'));

describe('NotfallBlock', () => {
	it('zeigt 112 als tel-Link mit sichtbarer Nummer', async () => {
		render(NotfallBlock, { now: TAGSUEBER });
		const link = page.getByTestId('kaelte-112-link');
		await expect.element(link).toHaveAttribute('href', 'tel:112');
		await expect.element(link).toHaveTextContent('112');
	});

	it('hat eine h2 und die Handlungsfolge in der Reihenfolge ansprechen, dann 112', async () => {
		render(NotfallBlock, { now: TAGSUEBER });
		await expect
			.element(page.getByRole('heading', { level: 2, name: 'Du siehst jemanden in der Kälte?' }))
			.toBeVisible();
		const text = root().textContent ?? '';
		expect(text.indexOf('höflich an')).toBeGreaterThan(-1);
		expect(text.indexOf('höflich an')).toBeLessThan(text.indexOf('ruf die 112'));
	});

	it('abends im November: drei Dienste erreichbar', async () => {
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		expect(statusOf('kaeltehilfetelefon')).toContain('Jetzt erreichbar bis 23:00 Uhr');
		expect(statusOf('kaeltebus')).toContain('Jetzt erreichbar bis 02:00 Uhr');
		expect(statusOf('waermebus')).toContain('Jetzt erreichbar bis 24:00 Uhr');
		expect(statusOf('karuna')).toBe('Morgen ab 09:00 Uhr');
	});

	it('nachts 1:30: nur der Kältebus erreichbar, Rest mit nächster Zeit', async () => {
		render(NotfallBlock, { now: NACHTS });
		expect(statusOf('kaeltebus')).toContain('Jetzt erreichbar');
		expect(statusOf('kaeltehilfetelefon')).toBe('Heute ab 19:00 Uhr');
		expect(statusOf('waermebus')).toBe('Heute ab 18:00 Uhr');
	});

	it('tagsüber: kein Nachtdienst erreichbar, alle mit Zeiten', async () => {
		render(NotfallBlock, { now: TAGSUEBER });
		for (const id of ['kaeltehilfetelefon', 'kaeltebus', 'waermebus']) {
			expect(statusOf(id)).toMatch(/^Heute ab \d\d:00 Uhr$/);
		}
	});

	it('Oktober: Kältehilfetelefon erreichbar, Busse ab 1. November', async () => {
		render(NotfallBlock, { now: OKTOBER });
		expect(statusOf('kaeltehilfetelefon')).toContain('Jetzt erreichbar');
		expect(statusOf('kaeltebus')).toBe('Ab 1. November');
		expect(statusOf('waermebus')).toBe('Ab 1. November');
	});

	function order(): (string | null)[] {
		return [...document.querySelectorAll('[data-testid^="kaelte-dienst-"]')].map((el) =>
			el.getAttribute('data-testid')
		);
	}

	it('bestätigt erreichbare Dienste stehen vor den übrigen, unbestätigte rücken nicht vor', async () => {
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		expect(order()).toEqual([
			'kaelte-dienst-kaeltehilfetelefon',
			'kaelte-dienst-waermebus',
			'kaelte-dienst-kaeltebus',
			'kaelte-dienst-karuna'
		]);
	});

	it('nachts 1:30: Kältebus bleibt "erreichbar", aber ohne Erfolgsoptik und nicht vorn', async () => {
		render(NotfallBlock, { now: NACHTS });
		expect(statusOf('kaeltebus')).toContain('Jetzt erreichbar');
		expect(order()[0]).toBe('kaelte-dienst-kaeltehilfetelefon');
		const bus = document.querySelector('[data-testid="kaelte-dienst-kaeltebus"]') as HTMLElement;
		expect(bus.className).not.toContain('state-success');
		expect(bus.querySelector('[data-testid="kaelte-status"]')?.className).not.toContain(
			'state-success'
		);
		expect(bus.querySelector('[data-testid="kaelte-unbestaetigt"]')).not.toBeNull();
	});

	it('bestätigt erreichbare Dienste sind grün hervorgehoben', async () => {
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		const tel = document.querySelector('[data-testid="kaelte-dienst-kaeltehilfetelefon"]');
		expect(tel?.className).toContain('state-success');
	});

	it('Handlungsfolge hat drei Schritte, der dritte verweist auf die Dienste', async () => {
		render(NotfallBlock, { now: TAGSUEBER });
		const items = root().querySelectorAll('ol > li');
		expect(items.length).toBe(3);
		expect(items[2].textContent).toContain('ruf einen der Dienste unten an');
	});

	it('Dienstnamen und aria-label folgen der Sprache (EN)', async () => {
		overwriteGetLocale(() => 'en');
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		const li = document.querySelector('[data-testid="kaelte-dienst-kaeltehilfetelefon"]');
		expect(li?.textContent).toContain('Cold Aid phone line');
		expect(li?.querySelector('a[href^="tel:"]')?.getAttribute('aria-label')).toBe(
			'Call Cold Aid phone line, 030 34397140'
		);
	});

	it('aktualisiert den Status minütlich ohne now-Prop', async () => {
		vi.useFakeTimers();
		try {
			vi.setSystemTime(new Date('2026-11-16T21:59:00Z')); // 22:59 Berlin
			render(NotfallBlock);
			expect(statusOf('kaeltehilfetelefon')).toContain('Jetzt erreichbar');
			await vi.advanceTimersByTimeAsync(60_000);
			flushSync();
			expect(statusOf('kaeltehilfetelefon')).toBe('Morgen ab 19:00 Uhr');
		} finally {
			vi.useRealTimers();
		}
	});

	it('jeder Dienst hat einen tel-Link mit sichtbarer Nummer und Namen im Label', async () => {
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		const link = document.querySelector(
			'[data-testid="kaelte-dienst-kaeltehilfetelefon"] a[href^="tel:"]'
		) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('tel:+493034397140');
		expect(link.textContent?.trim()).toBe('030 34397140');
		expect(link.getAttribute('aria-label')).toBe('Kältehilfetelefon anrufen, 030 34397140');
	});

	it('Juni: Saison-Hinweis, 112 bleibt sichtbar', async () => {
		render(NotfallBlock, { now: JUNI });
		await expect.element(page.getByTestId('kaelte-saison-hinweis')).toBeVisible();
		await expect.element(page.getByTestId('kaelte-112-link')).toBeVisible();
		expect(statusOf('kaeltehilfetelefon')).toBe('Ab 1. Oktober');
	});

	it('im Winter kein Saison-Hinweis', async () => {
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		expect(document.querySelector('[data-testid="kaelte-saison-hinweis"]')).toBeNull();
	});

	it('rechnet in Berliner Zeit, nicht in der Zeit des Geräts', async () => {
		// 21:30 Berlin, unabhängig von der Zeitzone des Rechners
		render(NotfallBlock, { now: new Date(Date.UTC(2026, 10, 16, 20, 30)) });
		expect(statusOf('kaeltehilfetelefon')).toContain('Jetzt erreichbar');
	});

	it('zeigt Stand-Datum, Haftungshinweis und Quellen', async () => {
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		const text = root().textContent ?? '';
		expect(text).toContain('Stand: 16. Oktober 2026');
		expect(text).toContain('Angaben ohne Gewähr. Im Zweifel ruf die 112.');
		expect(text).toContain('berlin.de/kaeltehilfe');
		expect(root().querySelector('time[datetime="2026-10-16"]')).not.toBeNull();
	});

	it('trennt die Quellen eines Dienstes mit Komma und Leerzeichen', async () => {
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		const tel = document.querySelector(
			'[data-testid="kaelte-dienst-kaeltehilfetelefon"]'
		) as HTMLElement;
		const kopie = tel.cloneNode(true) as HTMLElement;
		kopie.querySelectorAll('.sr-only').forEach((n) => n.remove());
		const text = (kopie.textContent ?? '').replace(/\s+/g, ' ');
		expect(text).toContain('berlin.de/kaeltehilfe, GEBEWO pro');
		expect(text).not.toMatch(/,\S/);
	});

	it('weist beim Kältebus auf den unbestätigten Betrieb hin', async () => {
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		const bus = document.querySelector('[data-testid="kaelte-dienst-kaeltebus"]');
		expect(bus?.textContent).toContain('noch nicht bestätigt');
		const tel = document.querySelector('[data-testid="kaelte-dienst-kaeltehilfetelefon"]');
		expect(tel?.textContent).not.toContain('noch nicht bestätigt');
	});

	it('verlinkt App und Wegweiser extern mit Hinweis auf neuen Tab', async () => {
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		const app = document.querySelector(
			'a[href="https://www.kaeltehilfe-berlin.de/kaeltehilfe-app"]'
		) as HTMLAnchorElement;
		const weg = document.querySelector(
			'a[href="https://www.kaeltehilfe-berlin.de/wegweiser"]'
		) as HTMLAnchorElement;
		for (const a of [app, weg]) {
			expect(a).not.toBeNull();
			expect(a.getAttribute('target')).toBe('_blank');
			expect(a.getAttribute('rel')).toContain('noopener');
			expect(a.textContent).toContain('(öffnet neuen Tab)');
		}
	});

	it('der Notfall-Block ist die einzige Box, Dienste und Links stehen auf Linien (#90)', async () => {
		render(NotfallBlock, { now: JUNI });
		await expect.element(page.getByTestId('kaelte-112-link')).toBeInTheDocument();
		// Anruf-Buttons (tel:) bleiben Buttons, gemeint sind Karten um Dienste, Hinweise und Links.
		const boxed = [...root().querySelectorAll('li, li > a:not([href^="tel:"]), p')].filter(
			(el) => /(^|\s)rounded(\s|$)/.test(el.className) && /(^|\s)border(\s|$)/.test(el.className)
		);
		expect(boxed).toHaveLength(0);
		for (const li of root().querySelectorAll('[data-testid^="kaelte-dienst-"]')) {
			expect(li.className).toMatch(/border-b/);
		}
	});

	it('enthält keine em-dashes', async () => {
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		expect((root().textContent ?? '').includes('—')).toBe(false);
	});

	it('rendert englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(NotfallBlock, { now: ABEND_NOVEMBER });
		await expect
			.element(page.getByRole('heading', { level: 2, name: 'See someone out in the cold?' }))
			.toBeVisible();
		expect(statusOf('kaeltehilfetelefon')).toContain('Available now until 23:00');
		expect(root().textContent).toContain('As of: October 16, 2026');
		expect(root().textContent?.includes('—')).toBe(false);
	});
});
