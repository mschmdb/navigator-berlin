import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SocialLinks from './social-links.svelte';

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
});
