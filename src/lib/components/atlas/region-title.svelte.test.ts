import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RegionTitle from './region-title.svelte';

describe('region-title.svelte', () => {
	it('rendert den Namen als H1 mit vollem Text', async () => {
		render(RegionTitle, { name: 'Otto-Suhr-Allee/Kantstraße' });
		const h1 = page.getByRole('heading', { level: 1 });
		await expect.element(h1).toHaveTextContent('Otto-Suhr-Allee/Kantstraße');
	});

	it('setzt nach jedem Schrägstrich eine Umbruchstelle', async () => {
		const { container } = render(RegionTitle, { name: 'Schönholz/Wilhelmsruh/Rosenthal' });
		expect(container.querySelectorAll('h1 wbr')).toHaveLength(2);
	});

	it('nutzt die Klasse, die lange Namen umbricht', async () => {
		const { container } = render(RegionTitle, { name: 'Blankenfelde/Niederschönhausen' });
		expect(container.querySelector('h1')?.classList.contains('region-title')).toBe(true);
	});
});
