import { expect, test } from '@playwright/test';

test.describe('L7: Layer-Seiten mit Karten-Button und Kiez-Rangliste', () => {
	test('Bestandsmiete: Karten-Button im ersten Bildschirm, Höchste und Niedrigste mit Kiez-Links', async ({
		page
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/layer/zensus-bestandsmiete-2022');
		const button = page.getByTestId('layer-detail-map-button');
		await expect(button).toBeInViewport();
		await expect(button).toHaveAttribute('href', '/explore?layers=zensus-bestandsmiete-2022');
		await expect(page.getByTestId('layer-kiez-ranking-top')).toBeVisible();
		await expect(page.getByTestId('layer-kiez-ranking-bottom')).toBeVisible();
		const links = page.getByTestId('layer-kiez-ranking-link');
		await expect(links).toHaveCount(10);
		await expect(links.first()).toHaveAttribute('href', /^\/kiez\/[a-z0-9-]+$/);
	});

	test('Altbau-Anteil: beide Listen', async ({ page }) => {
		await page.goto('/layer/zensus-altbau-anteil-2022');
		await expect(page.getByTestId('layer-kiez-ranking-top')).toBeVisible();
		await expect(page.getByTestId('layer-kiez-ranking-bottom')).toBeVisible();
	});

	test('Kiez-Score gesamt: Top 5, keine Flop-Liste', async ({ page }) => {
		await page.goto('/layer/kiez-score-gesamt');
		await expect(page.getByTestId('layer-kiez-ranking-top')).toBeVisible();
		await expect(page.getByTestId('layer-kiez-ranking-link')).toHaveCount(5);
		await expect(page.getByTestId('layer-kiez-ranking-bottom')).toHaveCount(0);
	});

	test('Lärm und Luft: Button, keine Rangliste', async ({ page }) => {
		for (const slug of ['laerm-2023', 'luft-2023']) {
			await page.goto(`/layer/${slug}`);
			await expect(page.getByTestId('layer-detail-map-button')).toBeVisible();
			await expect(page.getByTestId('layer-kiez-ranking')).toHaveCount(0);
		}
	});

	test('Layer ohne Kiez-Aggregat: Button, keine Rangliste', async ({ page }) => {
		await page.goto('/layer/kiez-score-ruhe-luft');
		await expect(page.getByTestId('layer-detail-map-button')).toBeVisible();
		await expect(page.getByTestId('layer-kiez-ranking')).toHaveCount(0);
	});

	test('EN: englische Texte und /en-Links', async ({ page }) => {
		await page.goto('/en/layer/zensus-altbau-anteil-2022');
		await expect(page.getByTestId('layer-detail-map-button')).toHaveAttribute(
			'href',
			/^\/en\/explore\?layers=/
		);
		await expect(page.getByRole('heading', { name: 'Highest values' })).toBeVisible();
		await expect(page.getByTestId('layer-kiez-ranking-link').first()).toHaveAttribute(
			'href',
			/^\/en\/kiez\//
		);
	});
});
