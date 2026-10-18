import { expect, test, type Page } from '@playwright/test';

// #150: Wer im Inspector zu einem Datensatz gescrollt hat und dann per Karten-Klick
// eine neue Adresse wählt, bleibt an derselben Stelle. Vorher sprang der Inspector
// auf „Gefühlte Temperatur“, weil Score, Wahl und Demografie nach dem Neuaufbau
// asynchron nachladen und die Position verschoben.

const FIRST = { lng: 13.43177, lat: 52.49845 };

async function waitForInspector(page: Page): Promise<void> {
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 30000 });
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 15000 });
}

/** Oberkante des Ankers relativ zum scrollenden Vorfahren des Inspectors. */
async function anchorOffset(page: Page, key: string): Promise<number | null> {
	return page.evaluate((anchorKey) => {
		const panel = document.querySelector<HTMLElement>('[data-testid="inspector-panel"]');
		let container: HTMLElement | null = panel;
		while (container) {
			const oy = getComputedStyle(container).overflowY;
			if ((oy === 'auto' || oy === 'scroll') && container.scrollHeight > container.clientHeight)
				break;
			container = container.parentElement;
		}
		const el = document.querySelector(`[data-scroll-anchor="${anchorKey}"]`);
		if (!container || !el) return null;
		return el.getBoundingClientRect().top - container.getBoundingClientRect().top;
	}, key);
}

test('Inspector hält die Leseposition, wenn der Pin auf eine neue Adresse springt', async ({
	page
}) => {
	await page.goto(`/explore?address=${FIRST.lng},${FIRST.lat}`);
	await waitForInspector(page);

	// Lärmbelastung als Datensatz suchen und an die Oberkante scrollen.
	const laerm = page
		.locator('[data-scroll-anchor^="hit:"]')
		.filter({ hasText: 'Lärmbelastung' })
		.first();
	await expect(laerm).toBeVisible({ timeout: 15000 });
	const key = await laerm.getAttribute('data-scroll-anchor');
	if (!key) throw new Error('Anker fehlt');
	await laerm.evaluate((el) => el.scrollIntoView({ block: 'start' }));
	// Score, Wahl und Klima der ersten Adresse sollen geladen sein.
	await page.waitForTimeout(2500);
	const before = await anchorOffset(page, key);
	expect(before).not.toBeNull();

	const label = await page.getByTestId('inspector-panel').getAttribute('aria-label');
	const canvas = page.locator('canvas.maplibregl-canvas');
	const box = await canvas.boundingBox();
	if (!box) throw new Error('Karten-Canvas fehlt');
	await canvas.click({ position: { x: box.width * 0.3, y: box.height * 0.4 } });
	await expect(page.getByTestId('inspector-panel')).not.toHaveAttribute('aria-label', label ?? '', {
		timeout: 15000
	});
	// Nachladen abwarten: Score, Wahl, Demografie, Klima.
	await page.waitForTimeout(3500);

	const after = await anchorOffset(page, key);
	expect(after).not.toBeNull();
	expect(Math.abs((after ?? 0) - (before ?? 0))).toBeLessThanOrEqual(24);
});
