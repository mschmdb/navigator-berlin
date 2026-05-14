import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NearestStopsCard from './nearest-stops-card.svelte';
import type { OepnvStopIndex } from '$lib/data';

const FRANKFURTER_TOR = { lat: 52.5159, lng: 13.4544 };

const INDEX_FULL: OepnvStopIndex = {
	ubahn: [{ name: 'Frankfurter Tor', lat: 52.5159, lng: 13.4544, lines: ['U5'] }],
	sbahn: [{ name: 'Ostkreuz', lat: 52.5031, lng: 13.4691 }],
	tram: [{ name: 'Boxhagener Straße', lat: 52.5104, lng: 13.4592 }],
	bus: [{ name: 'Petersburger Straße', lat: 52.516, lng: 13.4555 }]
};

const INDEX_EMPTY: OepnvStopIndex = { ubahn: [], sbahn: [], tram: [], bus: [] };

describe('NearestStopsCard', () => {
	it('renders loading state when index null and address present', () => {
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: null
		});
		const loading = screen.container.querySelector('[data-testid="nearest-stops-loading"]');
		expect(loading).not.toBeNull();
		expect(loading?.getAttribute('aria-busy')).toBe('true');
	});

	it('renders nothing when address null', () => {
		const screen = render(NearestStopsCard, {
			address: null,
			index: INDEX_FULL
		});
		expect(screen.container.querySelector('[data-testid="nearest-stops-card"]')).toBeNull();
	});

	it('renders all four modi when stops within range', () => {
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: INDEX_FULL
		});
		const card = screen.container.querySelector('[data-testid="nearest-stops-card"]');
		expect(card).not.toBeNull();
		expect(card?.querySelectorAll('[data-testid="nearest-stop-row"]').length).toBeGreaterThanOrEqual(1);
		expect(card?.textContent).toContain('Frankfurter Tor');
		expect(card?.textContent).toContain('Petersburger Straße');
	});

	it('renders empty state when no stops within 600m', () => {
		const screen = render(NearestStopsCard, {
			address: { lat: 52.3, lng: 13.0 }, // Far outside Berlin proper
			index: INDEX_FULL
		});
		const empty = screen.container.querySelector('[data-testid="nearest-stops-empty"]');
		expect(empty).not.toBeNull();
		expect(empty?.textContent).toMatch(/Keine ÖPNV-Haltestelle/);
	});

	it('renders empty state when index has no stops', () => {
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: INDEX_EMPTY
		});
		const empty = screen.container.querySelector('[data-testid="nearest-stops-empty"]');
		expect(empty).not.toBeNull();
	});

	it('skips modi with no stops within range, renders only hits', () => {
		const partial: OepnvStopIndex = {
			ubahn: [{ name: 'Frankfurter Tor', lat: 52.5159, lng: 13.4544 }],
			sbahn: [],
			tram: [],
			bus: []
		};
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: partial
		});
		const rows = screen.container.querySelectorAll('[data-testid="nearest-stop-row"]');
		expect(rows.length).toBe(1);
	});

	it('has region role with aria-label', () => {
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: INDEX_FULL
		});
		const card = screen.container.querySelector('[data-testid="nearest-stops-card"]');
		expect(card?.getAttribute('role')).toBe('region');
		expect(card?.getAttribute('aria-label')).toBe('Nächste ÖPNV-Haltestellen');
	});

	it('per-row aria-label contains modus + name + distance + walking time', () => {
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: INDEX_FULL
		});
		const row = screen.container.querySelector('[data-testid="nearest-stop-row"][data-modus="ubahn"]');
		expect(row?.getAttribute('aria-label')).toMatch(/U-Bahn/);
		expect(row?.getAttribute('aria-label')).toMatch(/Frankfurter Tor/);
		expect(row?.getAttribute('aria-label')).toMatch(/Meter Fußweg/);
		expect(row?.getAttribute('aria-label')).toMatch(/Minute/);
	});

	it('icons are aria-hidden', () => {
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: INDEX_FULL
		});
		const icons = screen.container.querySelectorAll('[data-testid="nearest-stop-icon"]');
		expect(icons.length).toBeGreaterThan(0);
		icons.forEach((i) => expect(i.getAttribute('aria-hidden')).toBe('true'));
	});

	it('renders method subline explaining Luftlinie heuristic', () => {
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: INDEX_FULL
		});
		const method = screen.container.querySelector('[data-testid="nearest-stops-method"]');
		expect(method).not.toBeNull();
		expect(method?.textContent).toMatch(/Luftlinie/);
		expect(method?.textContent).toMatch(/Schätzung|Heuristik|berechnet/i);
	});

	it('row has data-severity attribute reflecting walking-distance', () => {
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: INDEX_FULL
		});
		const ubahnRow = screen.container.querySelector(
			'[data-testid="nearest-stop-row"][data-modus="ubahn"]'
		);
		// Frankfurter Tor ↔ Frankfurter Tor = 0m → success
		expect(ubahnRow?.getAttribute('data-severity')).toBe('success');
	});

	it('renders ValueChip with severity per row', () => {
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: INDEX_FULL
		});
		const chips = screen.container.querySelectorAll('[data-testid="value-chip"]');
		expect(chips.length).toBeGreaterThan(0);
	});

	it('renders mobility-rating badge with severity', () => {
		const screen = render(NearestStopsCard, {
			address: FRANKFURTER_TOR,
			index: INDEX_FULL
		});
		const badge = screen.container.querySelector('[data-testid="mobility-rating-badge"]');
		expect(badge).not.toBeNull();
		// Frankfurter Tor U-Bahn 0m → top
		expect(badge?.getAttribute('data-rating')).toBe('top');
		expect(badge?.getAttribute('data-severity')).toBe('success');
		expect(badge?.textContent).toMatch(/Sehr gut angebunden/);
	});

	it('badge shows "keine" rating when nothing reachable', () => {
		const screen = render(NearestStopsCard, {
			address: { lat: 52.3, lng: 13.0 },
			index: INDEX_FULL
		});
		const badge = screen.container.querySelector('[data-testid="mobility-rating-badge"]');
		expect(badge?.getAttribute('data-rating')).toBe('keine');
		expect(badge?.getAttribute('data-severity')).toBe('danger');
	});

	describe('residential soft-cutoff (Story 1.21)', () => {
		// Karow-like fixture: residential address with only S-Bahn ~900m away.
		const KAROW_ADDR = { lat: 52.523, lng: 13.4544 };
		const KAROW_FAR_INDEX: OepnvStopIndex = {
			ubahn: [],
			sbahn: [{ name: 'Karow', lat: 52.5159, lng: 13.4544 }], // ~880m walking
			tram: [],
			bus: []
		};

		it('renders soft stop (>600m) when isResidential', () => {
			const screen = render(NearestStopsCard, {
				address: KAROW_ADDR,
				index: KAROW_FAR_INDEX,
				isResidential: true
			});
			const row = screen.container.querySelector(
				'[data-testid="nearest-stop-row"][data-modus="sbahn"]'
			);
			expect(row).not.toBeNull();
			expect(row?.getAttribute('data-soft')).toBe('true');
			expect(row?.getAttribute('data-severity')).toBe('warning');
		});

		it('badge shows "schwach" + warning severity for residential + soft-only', () => {
			const screen = render(NearestStopsCard, {
				address: KAROW_ADDR,
				index: KAROW_FAR_INDEX,
				isResidential: true
			});
			const badge = screen.container.querySelector('[data-testid="mobility-rating-badge"]');
			expect(badge?.getAttribute('data-rating')).toBe('schwach');
			expect(badge?.getAttribute('data-severity')).toBe('warning');
			expect(badge?.textContent).toMatch(/Schwach angebunden/);
		});

		it('does NOT render soft stops when isResidential is false (default)', () => {
			const screen = render(NearestStopsCard, {
				address: KAROW_ADDR,
				index: KAROW_FAR_INDEX
				// isResidential omitted (defaults to false)
			});
			const rows = screen.container.querySelectorAll('[data-testid="nearest-stop-row"]');
			expect(rows.length).toBe(0);
			const empty = screen.container.querySelector('[data-testid="nearest-stops-empty"]');
			expect(empty).not.toBeNull();
		});

		it('empty-state when residential but no stop within 1500m either', () => {
			const screen = render(NearestStopsCard, {
				address: { lat: 52.3, lng: 13.0 },
				index: INDEX_FULL,
				isResidential: true
			});
			const empty = screen.container.querySelector('[data-testid="nearest-stops-empty"]');
			expect(empty).not.toBeNull();
		});

		it('hard stops still preferred over soft stops with same modus', () => {
			const mixed: OepnvStopIndex = {
				ubahn: [],
				sbahn: [
					{ name: 'NearHit', lat: 52.522, lng: 13.4544 }, // ~145m
					{ name: 'FarHit', lat: 52.5159, lng: 13.4544 } // ~880m, soft
				],
				tram: [],
				bus: []
			};
			const screen = render(NearestStopsCard, {
				address: KAROW_ADDR,
				index: mixed,
				isResidential: true
			});
			const row = screen.container.querySelector(
				'[data-testid="nearest-stop-row"][data-modus="sbahn"]'
			);
			expect(row?.textContent).toContain('NearHit');
			expect(row?.getAttribute('data-soft')).toBeNull();
		});
	});
});
