import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import BriefwahlMarker from './briefwahl-marker.svelte';

describe('briefwahl-marker', () => {
	it('rendert nichts bei showBadge=false', async () => {
		render(BriefwahlMarker, { showBadge: false });
		await expect.element(page.getByTestId('briefwahl-marker')).not.toBeInTheDocument();
	});

	it('rendert Badge mit Default-Label bei showBadge=true', async () => {
		render(BriefwahlMarker, { showBadge: true });
		await expect.element(page.getByTestId('briefwahl-marker')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('briefwahl-marker-trigger'))
			.toHaveTextContent('Ohne Briefstimmen');
	});

	it('Trigger linkt auf methodikHref-Default mit Anchor', async () => {
		render(BriefwahlMarker, { showBadge: true });
		const trigger = page.getByTestId('briefwahl-marker-trigger');
		await expect
			.element(trigger)
			.toHaveAttribute('href', '/methodik/wahldaten#wahldaten-briefwahl');
	});

	it('Trigger linkt auf custom methodikHref', async () => {
		render(BriefwahlMarker, {
			showBadge: true,
			methodikHref: '/x#y'
		});
		await expect
			.element(page.getByTestId('briefwahl-marker-trigger'))
			.toHaveAttribute('href', '/x#y');
	});

	it('Tooltip ist aria-describedby-verknüpft', async () => {
		render(BriefwahlMarker, { showBadge: true });
		const trigger = page.getByTestId('briefwahl-marker-trigger');
		const tooltip = page.getByTestId('briefwahl-marker-tooltip');
		const describedBy = await trigger.element().getAttribute('aria-describedby');
		const tooltipId = await tooltip.element().getAttribute('id');
		expect(describedBy).toBeTruthy();
		expect(describedBy).toBe(tooltipId);
	});

	it('Tooltip-Text aus Prop übernommen', async () => {
		render(BriefwahlMarker, {
			showBadge: true,
			tooltip: 'Custom-Erklärung'
		});
		await expect
			.element(page.getByTestId('briefwahl-marker-tooltip'))
			.toHaveTextContent('Custom-Erklärung');
	});

	it('Custom-Testid wird angewendet', async () => {
		render(BriefwahlMarker, {
			showBadge: true,
			testid: 'wahl-x-marker'
		});
		await expect.element(page.getByTestId('wahl-x-marker')).toBeInTheDocument();
		await expect.element(page.getByTestId('wahl-x-marker-trigger')).toBeInTheDocument();
	});
});
