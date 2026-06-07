import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DistributionBar from './distribution-bar.svelte';
import type { DistSegment } from '$lib/data/steckbrief-extras.js';

describe('DistributionBar.svelte (Story 11.5)', () => {
	it('rendert nichts bei leeren Segmenten', async () => {
		render(DistributionBar, { segments: [] as DistSegment[] });
		expect(document.body.textContent).not.toMatch(/%/);
	});

	it('zeigt Prozent-Text (A11y) zusätzlich zum Balken', async () => {
		render(DistributionBar, {
			segments: [
				{ label: 'Mittel', share: 0.67 },
				{ label: 'Gut', share: 0.33 }
			]
		});
		expect(document.body.textContent).toContain('Mittel 67%');
		expect(document.body.textContent).toContain('Gut 33%');
	});
});
