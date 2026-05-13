import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import MauerSektorenDetail from './mauer-sektoren-detail.svelte';

describe('mauer-sektoren-detail.svelte (Phase-2-Stub)', () => {
	it('rendert historic-Hinweis + Quellen-Link', async () => {
		render(MauerSektorenDetail, {
			fetchedAt: '2026-04-01',
			sectorName: 'Sektor Mitte'
		});
		const el = (await page.getByTestId('mauer-sektoren-detail').element()) as HTMLElement;
		expect(el.textContent).toMatch(/1961/);
		expect(el.textContent).toMatch(/1989/);
	});

	it('Sektor-Name wird gerendert wenn gesetzt', async () => {
		render(MauerSektorenDetail, {
			fetchedAt: '2026-04-01',
			sectorName: 'Britischer Sektor'
		});
		const el = (await page.getByTestId('mauer-sektoren-detail').element()) as HTMLElement;
		expect(el.textContent).toMatch(/Britischer Sektor/);
	});

	it('Quellen-Link zu berlin-mauer.de', async () => {
		render(MauerSektorenDetail, { fetchedAt: '2026-04-01' });
		const link = (await page.getByTestId('mauer-source-link').element()) as HTMLAnchorElement;
		expect(link.href).toMatch(/berlin-mauer\.de/);
		expect(link.getAttribute('target')).toBe('_blank');
	});

	it('Plex-Mono-Footer mit Stand', async () => {
		render(MauerSektorenDetail, { fetchedAt: '2026-04-01' });
		const f = (await page.getByTestId('mauer-footer').element()) as HTMLElement;
		expect(f.className).toMatch(/font-mono/);
		expect(f.textContent).toMatch(/2026-04-01/);
	});
});
