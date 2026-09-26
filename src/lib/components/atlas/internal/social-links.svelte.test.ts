import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import SocialLinks from './social-links.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('social-links', () => {
	it('rendert alle Profil-Links mit zugänglichem Namen', async () => {
		render(SocialLinks, {});
		const links = (await page.getByRole('link').all()) as unknown[];
		expect(links.length).toBe(4);
		for (const label of [/Bluesky/, /LinkedIn/, /schmidbauer\.dev/, /GitHub/]) {
			await expect.element(page.getByLabelText(label)).toBeInTheDocument();
		}
	});

	it('verlinkt das öffentliche Repository', async () => {
		render(SocialLinks, {});
		const gh = (await page.getByLabelText(/GitHub/).element()) as HTMLAnchorElement;
		expect(gh.getAttribute('href')).toBe('https://github.com/mschmdb/navigator-berlin');
	});

	// Externe Links im neuen Tab brauchen noopener, sonst kann das Zieldokument
	// über window.opener auf die Ursprungsseite zugreifen.
	it('öffnet externe Ziele sicher', async () => {
		render(SocialLinks, {});
		const gh = (await page.getByLabelText(/GitHub/).element()) as HTMLAnchorElement;
		expect(gh.getAttribute('target')).toBe('_blank');
		expect(gh.getAttribute('rel')).toContain('noopener');
	});

	it('führt das SVG als dekorativ, der Name kommt vom Link', async () => {
		render(SocialLinks, {});
		const gh = (await page.getByLabelText(/GitHub/).element()) as HTMLElement;
		expect(gh.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
	});

	// i18n Block B2: aria-label geht über EINE Message mit {person}/{platform}
	// statt 4 separaten deutschen Literalen.
	it('EN: aria-label nutzt "on" statt "auf"', async () => {
		overwriteGetLocale(() => 'en');
		render(SocialLinks, {});
		const gh = (await page.getByLabelText(/GitHub/).element()) as HTMLAnchorElement;
		expect(gh.getAttribute('aria-label')).toBe('navigator.berlin on GitHub');
		const bluesky = (await page.getByLabelText(/Bluesky/).element()) as HTMLAnchorElement;
		expect(bluesky.getAttribute('aria-label')).toBe('Matze Schmidbauer on Bluesky');
	});
});
